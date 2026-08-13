const express = require("express");
const router = express.Router();
const PriceSet = require("../model/priceset");

// GET ALL PRICES

router.get("/", async (req, res) => {

  try {

    const { platform, search } = req.query;

    let query = {};

    // FILTER PLATFORM
    if (platform && platform !== "All Platforms") {

      query.platform = {
        $regex: new RegExp("^" + platform + "$", "i")
      };

    }

    // SEARCH
    if (search) {

      query.$or = [

        {
          platform: {
            $regex: search,
            $options: "i"
          }
        },

        {
          service: {
            $regex: search,
            $options: "i"
          }
        },

        {
          category: {
            $regex: search,
            $options: "i"
          }
        }

      ];

    }

    const [prices, allPrices] = await Promise.all([
      PriceSet.find(query).sort({ createdAt: -1 }),
      PriceSet.find({}).select("platform status")
    ]);

    const activePrices = allPrices.filter(
      (price) => String(price.status || "Active").toLowerCase() === "active"
    );

    const stats = {
      totalServices: allPrices.length,
      instagramCount: activePrices.filter(
        (price) => String(price.platform).toLowerCase() === "instagram"
      ).length,
      youtubeCount: activePrices.filter(
        (price) => String(price.platform).toLowerCase() === "youtube"
      ).length,
      tiktokCount: activePrices.filter(
        (price) => String(price.platform).toLowerCase() === "tiktok"
      ).length
    };

    res.json({
      success: true,
      prices,
      stats
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});


// GET SINGLE PRICE

router.get("/single", async (req, res) => {

  try {

    const { platform, service } = req.query;

    const price = await PriceSet.findOne({

      platform: new RegExp(platform, "i"),

      service: new RegExp(service, "i")

    });

    if (!price) {

      return res.status(404).json({

        success: false,

        message: "Price not found"

      });

    }

    res.json({

      success: true,

      price

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// CREATE PRICE

router.post("/", async (req, res) => {

  try {

    const body = { ...req.body };

    // VALIDATE PACKAGES
    if (
      !body.packages ||
      body.packages.length === 0
    ) {

      return res.status(400).json({

        success: false,

        message: "Packages required"

      });

    }

    // CLEAN + SORT
    body.packages = body.packages
      .map((pkg) => ({
        quantity: Number(pkg.quantity),
        price: Number(pkg.price),
        offerText: pkg.offerText || "",
        badge: pkg.badge || "",
        badgeColor: pkg.badgeColor || "",
        highlight: !!pkg.highlight,
        displayOrder: Number(pkg.displayOrder) || 0
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.quantity - b.quantity);

    const newPrice =
      new PriceSet(body);

    const savedPrice =
      await newPrice.save();

    res.status(201).json({

      success: true,

      price: savedPrice

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// UPDATE PRICE

router.put("/:id", async (req, res) => {

  try {

    const body = { ...req.body };

    // SORT PACKAGES
    if (body.packages?.length > 0) {

      body.packages = body.packages
        .map((pkg) => ({
          quantity: Number(pkg.quantity),
          price: Number(pkg.price),
          offerText: pkg.offerText || "",
          badge: pkg.badge || "",
          badgeColor: pkg.badgeColor || "",
          highlight: !!pkg.highlight,
          displayOrder: Number(pkg.displayOrder) || 0
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder || a.quantity - b.quantity);

    }

    const updatedPrice =
      await PriceSet.findByIdAndUpdate(

        req.params.id,

        body,

        {
          new: true,
          runValidators: true
        }

      );

    if (!updatedPrice) {

      return res.status(404).json({

        success: false,

        message: "Price entry not found"

      });

    }

    res.json({

      success: true,

      price: updatedPrice

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});


// ==============================
// DELETE PRICE
// ==============================

router.delete("/:id", async (req, res) => {

  try {

    const deletedPrice =
      await PriceSet.findByIdAndDelete(
        req.params.id
      );

    if (!deletedPrice) {

      return res.status(404).json({

        success: false,

        message: "Price entry not found"

      });

    }

    res.json({

      success: true,

      message: "Price deleted successfully"

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

});

module.exports = router;
