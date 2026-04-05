const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");
const {
  getOrderStatusLabel,
  sendOrderStatusUpdateEmail,
} = require("../../helpers/mailer");

const VALID_ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "inProcess",
  "inShipping",
  "delivered",
  "rejected",
]);

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "paid" });

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

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
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

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus || !VALID_ORDER_STATUSES.has(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid order status.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    if (order.orderStatus === orderStatus) {
      return res.status(200).json({
        success: true,
        message: `Order is already marked as ${getOrderStatusLabel(orderStatus)}.`,
        notification: {
          sent: false,
          reason: "No email sent because the order status did not change.",
        },
      });
    }

    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();
    await order.save();

    const user = await User.findById(order.userId).select("userName email").lean();

    let notification = {
      sent: false,
      reason: "No registered email found for this order.",
    };

    if (user?.email) {
      try {
        notification = await sendOrderStatusUpdateEmail({
          to: user.email,
          userName: user.userName,
          orderId: order._id,
          orderStatus,
          cartItems: order.cartItems,
        });
      } catch (mailError) {
        console.log("Order status email error:", mailError.message);
        notification = {
          sent: false,
          reason: "Order updated, but the notification email could not be sent.",
        };
      }
    }

    res.status(200).json({
      success: true,
      message: notification.sent
        ? "Order status updated successfully and customer email sent."
        : `Order status updated successfully. ${notification.reason}`,
      notification,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getMarketBasketInsights = async (req, res) => {
  try {
    const paidOrders = await Order.find({ paymentStatus: "paid" }).lean();

    if (!paidOrders.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const pairCounts = new Map();

    for (const order of paidOrders) {
      const uniqueProductIds = [
        ...new Set(order.cartItems.map((item) => String(item.productId))),
      ];

      for (let i = 0; i < uniqueProductIds.length; i++) {
        for (let j = i + 1; j < uniqueProductIds.length; j++) {
          const sortedPair = [uniqueProductIds[i], uniqueProductIds[j]].sort();
          const pairKey = sortedPair.join("__");

          pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1);
        }
      }
    }

    const topPairs = [...pairCounts.entries()]
      .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
      .slice(0, 8);

    if (!topPairs.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const allProductIds = [
      ...new Set(
        topPairs.flatMap(([pairKey]) => pairKey.split("__"))
      ),
    ];

    const products = await Product.find({
      _id: { $in: allProductIds },
    }).lean();

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const marketBasketInsights = topPairs
      .map(([pairKey, pairCount]) => {
        const [firstProductId, secondProductId] = pairKey.split("__");
        const firstProduct = productMap.get(firstProductId);
        const secondProduct = productMap.get(secondProductId);

        if (!firstProduct || !secondProduct) {
          return null;
        }

        return {
          pairKey,
          pairCount,
          pairSupport: Number(((pairCount / paidOrders.length) * 100).toFixed(1)),
          products: [
            {
              _id: firstProduct._id,
              title: firstProduct.title,
              image: firstProduct.image,
            },
            {
              _id: secondProduct._id,
              title: secondProduct.title,
              image: secondProduct.image,
            },
          ],
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      data: marketBasketInsights,
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
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
  getMarketBasketInsights,
};
