const express = require("express");
const axios = require("axios");
const router = express.Router();

const Order = require("../model/order");
const Service = require("../model/service");
const providerService = require("../services/providerservices");


// CREATE ORDER + AUTO SEND
router.post("/create", async (req, res) => {
  try {
    // 1. Find the order that was just paid on the website
    let order = await Order.findOne({ order_id: req.body.order_id });

   if (!order) {

  const serviceId =
    Number(req.body.serviceId) ||
    Number(req.body.service?.service_id);

  const serviceName =
    req.body.serviceName ||
    req.body.service?.name ||
    "SMM Service";

  order = new Order({

    order_id:
      req.body.order_id,

    link:
      req.body.link,

    quantity:
      Number(req.body.quantity),

    status:
      "Pending",

    service: {

      service_id:
        Number(serviceId),

      name:
        serviceName

    }

  });

  await order.save();

  console.log(
    "NEW PANEL ORDER SAVED:",
    order
  );
}
    // 2. Extract data from request or order (fallback to what's in 'order' if not in req.body)
console.log(
  "REQ BODY:",
  JSON.stringify(req.body, null, 2)
);

console.log(
  "SERVICE OBJECT:",
  req.body.service
);

let rawServiceId =
  Number(req.body.serviceId) ||
  Number(req.body.service?.service_id) ||
  Number(order.service?.service_id);

// Dynamically lookup serviceId by name if it's missing or NaN
if (!rawServiceId || isNaN(rawServiceId)) {
  const serviceName = req.body.serviceName || req.body.service?.name || order.service?.name;
  if (serviceName) {
    const s = await Service.findOne({ name: serviceName });
    if (s) {
      rawServiceId = s.provider_service_id;
      console.log(`Resolved missing serviceId to ${rawServiceId} for Order ${order.order_id} using service name "${serviceName}"`);
    }
  }
}

console.log(
  "RAW SERVICE ID:",
  rawServiceId
);

const serviceId =
  Number(rawServiceId);

console.log(
  "FINAL SERVICE ID:",
  serviceId
);
    const link = req.body.link || order.link;
const quantity =
  Number(req.body.quantity) ||
  Number(order.quantity) ||
  50;
      const serviceName = req.body.serviceName || order.service?.name || "SMM Service";

    // 3. Update the order object in memory and DB so we don't lose this info
    if (serviceId) {
      order.service = {
        service_id: serviceId,
        name: serviceName
      };
    }
    if (link) order.link = link;
    if (quantity) order.quantity = quantity;

   console.log("SERVICE ID:", serviceId);
console.log("LINK:", link);
console.log("QUANTITY:", quantity);

if (
  isNaN(serviceId) ||
  !link ||
  Number(quantity) <= 0
) {

  console.log("INVALID ORDER DATA:", {
    serviceId,
    link,
    quantity
  });

  await order.save();

  throw new Error(
    `Missing serviceId, link or quantity for Order ${order.order_id}`
  );
}

    if (order.provider_order_id) {
      console.log(`Order ${order.order_id} already has a Provider ID: ${order.provider_order_id}. Skipping send.`);
      return res.json({ success: true, message: "Order already sent to provider", order });
    }

    const result = await providerService.sendOrder(
      serviceId,
      link,
      quantity
    );

    // 3. Update the status so the CRON picks it up
    if (result && result.order) {
      order.provider_order_id = result.order;
      order.status = "Processing";
      await order.save();

      console.log(`✅ Order ${order.order_id} pushed to Provider. API ID: ${result.order}`);
      res.json({ success: true, order });
    } else {
      res.status(400).json({ error: "Provider rejected order", details: result });
    }
  } catch (err) {
    console.error("Critical Panel Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {

  try {

    // LIVE USD TO INR RATE
    let USD_TO_INR = 95;

    try {

      const response = await axios.get(
        "https://open.er-api.com/v6/latest/USD"
      );

      USD_TO_INR =
        response.data.rates.INR || 95;

    } catch (currencyError) {

      console.log(
        "Currency API Error:",
        currencyError.message
      );

    }


    // GET ORDERS
    const orders = await Order.find()
      .sort({ createdAt: -1 });


    // CONVERT USD -> INR
    const formattedOrders = orders.map(order => ({

      ...order.toObject(),

      usd_amount: Number(order.amount || 0),

      inr_amount: Number(
        (
          Number(order.amount || 0) * USD_TO_INR
        ).toFixed(2)
      ),

      currency_rate: USD_TO_INR

    }));


    res.json(formattedOrders);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});


// Add this to your order routes file in the Panel Backend
router.post("/sync", async (req, res) => {
  try {
    // 1. Find orders that are "pending" or "paid" but haven't been sent to provider yet
    const pendingOrders = await Order.find({
      status: { $in: ["pending", "Pending", "paid", "Paid"] },
      provider_order_id: { $exists: false }
    });

    if (pendingOrders.length === 0) {
      return res.json({ message: "No pending orders to sync." });
    }

    const results = [];

    for (const order of pendingOrders) {
      try {
        // 2. Push to CheapestSMM API
        let serviceId = order.service?.service_id || order.service_id;
        const link = order.link;
        const quantity = order.quantity;

        // Dynamically lookup serviceId by name if it's missing or NaN
        if (!serviceId || isNaN(serviceId)) {
          const serviceName = order.service?.name;
          if (serviceName) {
            const s = await Service.findOne({ name: serviceName });
            if (s) {
              serviceId = s.provider_service_id;
              order.service = order.service || {};
              order.service.service_id = serviceId;
              await order.save();
              console.log(`Resolved missing service_id to ${serviceId} for Order ${order.order_id} during sync using service name "${serviceName}"`);
            }
          }
        }

        if (!serviceId || isNaN(serviceId) || !link || !quantity) {
          results.push({ id: order.order_id, status: "Skipped", message: "Incomplete order data (serviceId, link, or quantity missing)" });
          continue;
        }

        const result = await providerService.sendOrder(
          serviceId,
          link,
          quantity
        );

        if (result.order) {
          order.provider_order_id = result.order;
          order.status = "Processing"; // Now the Cron job will take over
          await order.save();
          results.push({ id: order.order_id, status: "Sent Successfully" });
        }
      } catch (err) {
        results.push({ id: order.order_id, status: "Error", message: err.message });
      }
    }

    res.json({ success: true, processed: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to receive order completion notifications
router.post("/update", async (req, res) => {
  const { orderId, status, provider_order_id } = req.body;
  console.log(`✅ [Notification Received] Order ${orderId} is now ${status}`);

  try {
    const order = await Order.findOne({ order_id: orderId });
    if (order) {
      if (status) order.status = status;
      if (provider_order_id) order.provider_order_id = provider_order_id;
      await order.save();
      console.log(`✅ Order ${orderId} updated: status=${order.status}, provider_order_id=${order.provider_order_id}`);
      res.json({ success: true, message: `Status for order ${orderId} updated to ${status}` });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
