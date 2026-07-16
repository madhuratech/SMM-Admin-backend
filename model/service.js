const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    required: true
  },

  provider: {
    type: String,
    required: true
  },

  // IMPORTANT
  provider_service_id: {
    type: Number,
    required: true
  },

  rate: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  min: {
    type: Number,
    default: 10
  },

  max: {
    type: Number,
    default: 10000
  },

  contentType: {
    type: String,
    enum: ["profile", "post", "reel", "story", "highlight", "live", "channel", "video", "group"],
    default: "post"
  },

  status: {
    type: String,
    default: "Active"
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model(
    "Service",
    ServiceSchema
  );