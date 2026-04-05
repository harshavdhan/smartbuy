const crypto = require("crypto");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const User = require("../../models/User");
const {
  createRazorpayOrder,
  getRazorpayCredentials,
} = require("../../helpers/razorpay");
const { sendOrderPlacedEmail } = require("../../helpers/mailer");

async function validateCartStock(cartItems) {
  for (const item of cartItems) {
    const product = await Product.findById(item.productId);

    if (!product) {
      return {
        success: false,
        statusCode: 404,
        message: `Product not found: ${item.title}`,
      };
    }

    if (product.totalStock < item.quantity) {
      return {
        success: false,
        statusCode: 400,
        message: `Not enough stock for product: ${item.title}`,
      };
    }
  }

  return { success: true };
}

async function reduceProductStock(cartItems) {
  for (const item of cartItems) {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new Error(`Product not found during stock update: ${item.title}`);
    }

    product.totalStock -= item.quantity;
    await product.save();
  }
}

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems = [],
      addressInfo,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    if (!userId || !cartId || !cartItems.length || !addressInfo || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Incomplete order data",
      });
    }

    const cart = await Cart.findById(cartId);

    if (!cart || !cart.items || !cart.items.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty or unavailable",
      });
    }

    const stockValidation = await validateCartStock(cartItems);

    if (!stockValidation.success) {
      return res.status(stockValidation.statusCode).json({
        success: false,
        message: stockValidation.message,
      });
    }

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(Number(totalAmount) * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        cartId,
      },
    });

    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus: "pending",
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentMethod: "razorpay",
      paymentStatus: "created",
      paymentOrderId: razorpayOrder.id,
    });

    await newlyCreatedOrder.save();

    const { keyId } = getRazorpayCredentials();

    res.status(201).json({
      success: true,
      keyId,
      dbOrderId: newlyCreatedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message:
        e.message === "Razorpay credentials are missing"
          ? "Razorpay is not configured on the server"
          : e.message || "Some error occurred!",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      dbOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !dbOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment verification data",
      });
    }

    const order = await Order.findById(dbOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        orderId: order._id,
      });
    }

    if (order.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order mismatch",
      });
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const stockValidation = await validateCartStock(order.cartItems);

    if (!stockValidation.success) {
      return res.status(stockValidation.statusCode).json({
        success: false,
        message: stockValidation.message,
      });
    }

    await reduceProductStock(order.cartItems);
    await Cart.findByIdAndDelete(order.cartId);

    order.orderStatus = "confirmed";
    order.paymentStatus = "paid";
    order.paymentId = razorpay_payment_id;
    order.paymentSignature = razorpay_signature;
    order.orderUpdateDate = new Date();

    await order.save();

    const user = await User.findById(order.userId).select("userName email").lean();

    let emailNotification = {
      sent: false,
      reason: "No registered email found for this order.",
    };

    if (user?.email) {
      try {
        emailNotification = await sendOrderPlacedEmail({
          to: user.email,
          userName: user.userName,
          orderId: order._id,
          orderStatus: order.orderStatus,
          cartItems: order.cartItems,
        });
      } catch (mailError) {
        console.log("Order confirmation email error:", mailError.message);
        emailNotification = {
          sent: false,
          reason: "Payment verified, but the confirmation email could not be sent.",
        };
      }
    }

    res.status(200).json({
      success: true,
      message: emailNotification.sent
        ? "Payment verified, order confirmed, and confirmation email sent."
        : `Payment verified and order confirmed. ${emailNotification.reason}`,
      orderId: order._id,
      emailNotification,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message:
        e.message === "Razorpay credentials are missing"
          ? "Razorpay is not configured on the server"
          : e.message || "Some error occurred!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId, paymentStatus: "paid" });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order || order.paymentStatus !== "paid") {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  verifyRazorpayPayment,
  getAllOrdersByUser,
  getOrderDetails,
};
