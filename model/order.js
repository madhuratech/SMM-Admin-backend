const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  order_id: { type: Number, unique: true },

  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,

  username: String,

  amount: Number,
  platform: String,

  service: {
    service_id: Number,
    name: String
  },

  link: String,
  quantity: Number,
  comments: String,

  provider_order_id: String,
  start_count: String,
  remains: String,


  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);