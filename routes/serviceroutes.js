const express = require("express");
const router = express.Router();
const axios = require("axios");

const Service = require("../model/service");
const Platform = require("../model/platform");
const Provider = require("../model/provider");

// GET ALL SERVICES
router.get("/", async (req, res) => {

  try {

    const services = await Service.find().sort({
      createdAt: -1
    });

    res.json({
      success: true,
      services
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});



// IMPORT PROVIDER SERVICES
// IMPORTANT:
// ONLY FETCH
// DO NOT SAVE TO DATABASE

router.post("/:id/import-services", async (req, res) => {

  try {

    const provider = await Provider.findById(
      req.params.id
    );

    if (!provider) {

      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });

    }

    // FETCH SERVICES FROM PROVIDER API

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

    // FORMAT SERVICES

    const formattedServices =
      response.data.map((s) => ({

        provider_service_id:
          Number(s.service),

        name:
          s.name || "Unknown Service",

        type:
          s.category || "General",

        rate:
          Number(s.rate) || 0,

        min:
          Number(s.min) || 1,

        max:
          Number(s.max) || 10000

      }));


    // IMPORTANT
    // DO NOT SAVE SERVICES HERE

    res.json({
      success: true,
      services: formattedServices
    });

  } catch (error) {

    console.log(
      "IMPORT SERVICES ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});



// CREATE NEW SERVICE
// SAVE ONLY SELECTED SERVICE

router.post("/", async (req, res) => {

  try {

    console.log("REQ BODY:", JSON.stringify(req.body));

    const {

      name,
      type,
      provider,
      provider_service_id,
      rate,
      price,
      min,
      max,
      status,
      contentType

    } = req.body;


    // VALIDATION

    if (
      !name ||
      !type ||
      !provider ||
      !provider_service_id ||
      rate === undefined ||
      price === undefined
    ) {

      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });

    }


    // CHECK DUPLICATE

    const exists =
      await Service.findOne({
        provider_service_id:
          Number(provider_service_id)
      });

    if (exists) {

      return res.status(400).json({
        success: false,
        message:
          `Service already exists (${exists.name})`
      });

    }


    // SAVE PLATFORM AUTOMATICALLY

    const existingPlatform =
      await Platform.findOne({
        name: type
      });

    if (!existingPlatform) {

      await Platform.create({
        name: type
      });

    }


    // CLEAN NAME

    const cleanName =
      name.split("|")[0].trim();


    // CREATE SERVICE

    const service =
      new Service({

        name: cleanName,

        type,

        provider,

        provider_service_id:
          Number(provider_service_id),

        rate:
          Number(rate),

        price:
          Number(price),

        min:
          Number(min) || 10,

        max:
          Number(max) || 10000,

        status:
          status || "Active",

        contentType:
          contentType || "post"

      });


    await service.save();


    res.status(201).json({
      success: true,
      service
    });

  } catch (error) {

    console.log(
      "CREATE SERVICE ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});



// UPDATE SERVICE

router.put("/:id", async (req, res) => {

  try {

    const service =
      await Service.findById(
        req.params.id
      );

    if (!service) {

      return res.status(404).json({
        success: false,
        message: "Service not found"
      });

    }


    const {

      name,
      type,
      provider,
      provider_service_id,
      rate,
      price,
      min,
      max,
      status,
      contentType

    } = req.body;



    // CHECK DUPLICATE

    if (
      provider_service_id !== undefined
    ) {

      const exists =
        await Service.findOne({

          provider_service_id:
            Number(provider_service_id),

          _id: {
            $ne: req.params.id
          }

        });

      if (exists) {

        return res.status(400).json({
          success: false,
          message:
            `Provider Service ID already exists`
        });

      }

    }



    // UPDATE VALUES

    if (name) {
      service.name =
        name.split("|")[0].trim();
    }

    if (type) {
      service.type = type;
    }

    if (provider) {
      service.provider = provider;
    }

    if (
      provider_service_id !== undefined
    ) {

      service.provider_service_id =
        Number(provider_service_id);

    }

    if (rate !== undefined) {
      service.rate = Number(rate);
    }

    if (price !== undefined) {
      service.price = Number(price);
    }

    if (min !== undefined) {
      service.min = Number(min);
    }

    if (max !== undefined) {
      service.max = Number(max);
    }

    if (contentType) {
      service.contentType = contentType;
    }

    if (status) {
      service.status = status;
    }


    await service.save();


    res.json({
      success: true,
      service
    });

  } catch (error) {

    console.log(
      "UPDATE SERVICE ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});



// DELETE SERVICE

router.delete("/:id", async (req, res) => {

  try {

    const deleted =
      await Service.findByIdAndDelete(
        req.params.id
      );

    if (!deleted) {

      return res.status(404).json({
        success: false,
        message: "Service not found"
      });

    }

    res.json({
      success: true,
      message:
        "Service deleted successfully"
    });

  } catch (error) {

    console.log(
      "DELETE SERVICE ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


module.exports = router;