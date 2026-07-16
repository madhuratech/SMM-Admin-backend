const express = require("express");
const router = express.Router();

const Platform = require("../model/platform");
const Service = require("../model/service");


// GET ALL PLATFORMS
router.get("/", async (req, res) => {

  try {

    const platforms = await Platform.find();

    res.json({
      success: true,
      platforms: platforms.map((p) => p.name)
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// ADD NEW PLATFORM
router.post("/", async (req, res) => {

  try {

    const { name } = req.body;

    if (!name) {

      return res.status(400).json({
        success: false,
        message: "Platform name required"
      });

    }

    const existing = await Platform.findOne({
      name
    });

    if (existing) {

      return res.json({
        success: true,
        message: "Platform already exists"
      });

    }

    await Platform.create({
      name
    });

    res.json({
      success: true,
      message: "Platform added successfully"
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// GET PLATFORMS + SERVICES
router.get("/services/all", async (req, res) => {

  try {

    const platforms = await Platform.find();

    const services = await Service.find();

    const uniqueServices = [
      ...new Set(
        services.map((s) => s.name)
      )
    ];

    res.json({
      success: true,
      platforms: platforms.map((p) => p.name),
      services: uniqueServices
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

module.exports = router;