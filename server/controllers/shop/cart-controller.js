const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

function getNormalizedSizes(sizeValue) {
  if (Array.isArray(sizeValue)) {
    return [...new Set(sizeValue.map((size) => String(size).trim()).filter(Boolean))];
  }

  if (typeof sizeValue !== "string") {
    return [];
  }

  return [...new Set(sizeValue.split(",").map((size) => size.trim()).filter(Boolean))];
}

function normalizeSelectedSize(sizeValue) {
  return typeof sizeValue === "string" ? sizeValue.trim() : "";
}

function getPopulatedCartItems(items = []) {
  return items.map((item) => ({
    cartItemId: item._id ? String(item._id) : null,
    productId: item.productId ? String(item.productId._id) : null,
    image: item.productId ? item.productId.image : null,
    title: item.productId ? item.productId.title : "Product not found",
    price: item.productId ? item.productId.price : null,
    salePrice: item.productId ? item.productId.salePrice : null,
    size: item.size || "",
    quantity: item.quantity,
  }));
}

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size } = req.body;
    const normalizedSelectedSize = normalizeSelectedSize(size);

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const availableSizes = getNormalizedSizes(product.size);

    if (availableSizes.length > 0 && !normalizedSelectedSize) {
      return res.status(400).json({
        success: false,
        message: "Please select a size",
      });
    }

    if (
      availableSizes.length > 0 &&
      !availableSizes.includes(normalizedSelectedSize)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected size is not available",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (item.size || "") === normalizedSelectedSize
    );

    if (findCurrentProductIndex === -1) {
      cart.items.push({ productId, size: normalizedSelectedSize, quantity });
    } else {
      cart.items[findCurrentProductIndex].quantity += quantity;
    }

    await cart.save();
    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: getPopulatedCartItems(cart.items),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is manadatory!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const validItems = cart.items.filter((productItem) => productItem.productId);

    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: getPopulatedCartItems(validItems),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const updateCartItemQty = async (req, res) => {
  try {
    const { userId, cartItemId, quantity } = req.body;

    if (!userId || !cartItemId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item._id.toString() === cartItemId
    );

    if (findCurrentProductIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Cart item not present !",
      });
    }

    cart.items[findCurrentProductIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: getPopulatedCartItems(cart.items),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { userId, cartItemId } = req.params;
    if (!userId || !cartItemId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== cartItemId
    );

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: getPopulatedCartItems(cart.items),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = {
  addToCart,
  updateCartItemQty,
  deleteCartItem,
  fetchCartItems,
};
