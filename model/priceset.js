const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({

  quantity: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },
  
  offerText: String,

  badge: String,

  badgeColor: String,

  highlight: {
    type: Boolean,
    default: false
  },

  displayOrder: {
    type: Number,
    default: 0
  }
});

const PriceSetSchema = new mongoose.Schema({

  platform: {
    type: String,
    required: true
  },

  service: {
    type: String,
    required: true
  },

  serviceId: {
    type: String
  },

  serviceKey: {
    type: String
  },

  category: String,

  status: {
    type: String,
    default: "Active"
  },

  pricingType: {
    type: String,
    enum: ["custom", "package"],
    default: "package"
  },

  packages: [PackageSchema],

  minOrder: {
    type: Number,
    default: 100
  },

  maxOrder: {
    type: Number,
    default: 10000
  },

  description: {
    type: String,
    maxLength: 200
  },

  note: {
    type: String,
    maxLength: 200
  }

}, { timestamps: true });

module.exports = mongoose.model(
  "PriceSet",
  PriceSetSchema
);