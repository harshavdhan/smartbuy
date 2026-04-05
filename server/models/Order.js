const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: String,
  cartId: String,
  paymentMethod: String,
  paymentStatus: String,
  paymentId: String,
  paymentOrderId: String,
  paymentSignature: String,
  cartItems: [
    {
      productId: String,
      title: String,
      image: String,
      size: String,
      price: String,
      quantity: Number,
    },
  ],
  addressInfo: {
    addressId: String,
    address: String,
    city: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  orderStatus: String,
  totalAmount: Number,
  orderDate: Date,
  orderUpdateDate: Date,
});

module.exports = mongoose.model("Order", OrderSchema);
