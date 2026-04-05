const Product = require("../../models/Product");
const Order = require("../../models/Order");

async function getFrequentlyBoughtTogetherProducts(productId, limit = 4) {
  const matchingOrders = await Order.find({
    paymentStatus: "paid",
    "cartItems.productId": productId,
  }).lean();

  if (!matchingOrders.length) {
    return [];
  }

  const coPurchaseCounts = new Map();

  for (const order of matchingOrders) {
    const uniqueProductIds = [
      ...new Set(order.cartItems.map((item) => String(item.productId))),
    ];

    for (const currentProductId of uniqueProductIds) {
      if (currentProductId === String(productId)) {
        continue;
      }

      coPurchaseCounts.set(
        currentProductId,
        (coPurchaseCounts.get(currentProductId) || 0) + 1
      );
    }
  }

  const sortedRecommendations = [...coPurchaseCounts.entries()]
    .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
    .slice(0, limit);

  if (!sortedRecommendations.length) {
    return [];
  }

  const recommendedProducts = await Product.find({
    _id: { $in: sortedRecommendations.map(([recommendedProductId]) => recommendedProductId) },
  }).lean();

  const recommendedProductsMap = new Map(
    recommendedProducts.map((product) => [String(product._id), product])
  );

  return sortedRecommendations
    .map(([recommendedProductId, supportCount]) => {
      const recommendedProduct = recommendedProductsMap.get(recommendedProductId);

      if (!recommendedProduct) {
        return null;
      }

      return {
        ...recommendedProduct,
        supportCount,
        confidence: Number(
          ((supportCount / matchingOrders.length) * 100).toFixed(1)
        ),
      };
    })
    .filter(Boolean);
}

const getFilteredProducts = async (req, res) => {
  try {
    const { category = [], brand = [], sortBy = "price-lowtohigh" } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (brand.length) {
      filters.brand = { $in: brand.split(",") };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      default:
        sort.price = 1;
        break;
    }

    const products = await Product.find(filters).sort(sort);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    const marketBasketRecommendations =
      await getFrequentlyBoughtTogetherProducts(id);

    res.status(200).json({
      success: true,
      data: {
        ...product,
        marketBasketRecommendations,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

module.exports = { getFilteredProducts, getProductDetails };
