const mongoose = require("mongoose");

const ProviderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    api_url: { type: String, required: true },
    api_key: { type: String },
    balance: { type: Number, default: 0 },
    success_rate: { type: Number, default: 100 },
    status: { type: String, default: "Active" },
    latency: { type: String, default: "Unknown" }
}, { timestamps: true });

module.exports = mongoose.model("Provider", ProviderSchema);