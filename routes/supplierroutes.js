const express = require("express");
const router = express.Router();

const axios = require("axios");

const Provider = require("../model/provider");
const Service = require("../model/service");


// GET ALL SUPPLIERS
router.get("/", async (req, res) => {

  try {

    const providers = await Provider.find();

    res.json({
      success: true,
      suppliers: providers
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// ADD NEW SUPPLIER
router.post("/", async (req, res) => {

  try {

    const {
      name,
      url,
      key,
      balance,
      success_rate
    } = req.body;

    if (!name || !url) {

      return res.status(400).json({
        success: false,
        message: "Name and URL required"
      });

    }

    const provider = new Provider({

      name,

      api_url: url,

      api_key: key || "",

      balance: Number(balance) || 0,

      success_rate: Number(success_rate) || 100,

      status: "Active",

      latency: "45ms"

    });

    await provider.save();

    res.status(201).json({
      success: true,
      supplier: provider
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// UPDATE SUPPLIER
router.put("/:id", async (req, res) => {

  try {

    const provider = await Provider.findById(
      req.params.id
    );

    if (!provider) {

      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });

    }

    const {
      name,
      url,
      key,
      balance,
      success_rate,
      status
    } = req.body;

    if (name) provider.name = name;

    if (url) provider.api_url = url;

    if (key) provider.api_key = key;

    if (balance !== undefined) {
      provider.balance = Number(balance);
    }

    if (success_rate !== undefined) {
      provider.success_rate = Number(success_rate);
    }

    if (status) {
      provider.status = status;
    }

    await provider.save();

    res.json({
      success: true,
      supplier: provider
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// REAL BALANCE SYNC
router.post("/:id/sync", async (req, res) => {

  try {

    const provider = await Provider.findById(
      req.params.id
    );

    if (!provider) {

      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });

    }

    // API BALANCE FETCH
    const response = await axios.post(
      provider.api_url,
      null,
      {
        params: {
          key: provider.api_key,
          action: "balance"
        }
      }
    );

    provider.balance = Number(
      response.data.balance || 0
    );

    provider.currency =
      response.data.currency || "USD";

    provider.status =
      provider.balance > 10
        ? "Active"
        : "Warning";

    provider.latency = "Live";

    await provider.save();

    res.json({
      success: true,
      supplier: provider
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Supplier API connection failed"
    });

  }

});


// IMPORT SERVICES
router.post("/:id/import-services", async (req, res) => {

  try {

    const provider = await Provider.findById(
      req.params.id
    );

    if (!provider) {

      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });

    }

    // FETCH SERVICES FROM PROVIDER
    const response = await axios.post(
      provider.api_url,
      null,
      {
        params: {
          key: provider.api_key,
          action: "services"
        }
      }
    );

    const services = response.data;

    if (!Array.isArray(services)) {

      return res.status(400).json({
        success: false,
        message: "Invalid supplier response"
      });

    }

    // Normalize services for frontend selection
    const normalizedServices = services.map(item => ({
      provider_service_id: Number(item.service),
      name: item.name,
      type: item.category || "Other",
      provider: provider.name,
      rate: Number(item.rate),
      min: Number(item.min),
      max: Number(item.max),
      status: "Active"
    }));

    res.json({
      success: true,
      services: normalizedServices
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch provider services"
    });

  }

});


// DELETE SUPPLIER
router.delete("/:id", async (req, res) => {

  try {

    const deleted = await Provider.findByIdAndDelete(
      req.params.id
    );

    if (!deleted) {

      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });

    }

    res.json({
      success: true,
      message: "Supplier deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

module.exports = router;