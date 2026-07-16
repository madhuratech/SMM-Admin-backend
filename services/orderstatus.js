const mongoose = require('mongoose');
const axios = require("axios");
const cron = require("node-cron");
const Order = require("../model/order");
const Service = require("../model/service");
const { checkOrderStatus, sendOrder } = require("./providerservices");

// Update with your Website Server URL
const WEBSITE_URL = process.env.WEBSITE_URL || "http://localhost:5001";

cron.schedule("*/30 * * * * *", async () => {
  console.log("--- Background Job: Checking Orders ---");

  try {
    // 1. AUTO-SEND PENDING ORDERS THAT LACK PROVIDER ID
    const unsentOrders = await Order.find({
      status: { $in: ["pending", "Pending", "paid", "Paid"] },
      $or: [
        { provider_order_id: { $exists: false } },
        { provider_order_id: null }
      ]
    });

    if (unsentOrders.length > 0) {
      console.log(`Found ${unsentOrders.length} unsent orders. Syncing...`);
      for (const order of unsentOrders) {
        try {
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
                console.log(`Resolved missing service_id to ${serviceId} for Order ${order.order_id} using service name "${serviceName}"`);
              }
            }
          }

          const serviceName = order.service?.name || "";
          const result = await sendOrder(serviceId, order.link, order.quantity, serviceName);
          if (result && result.order) {
            order.provider_order_id = result.order;
            order.status = "Processing";
            await order.save();
            console.log(`✅ Order ${order.order_id} automatically sent to provider. API ID: ${result.order}`);
          }
        } catch (err) {
          console.log(`Failed to auto-send order ${order.order_id}:`, err.message);
        }
      }
    }

    // 2. CHECK STATUS FOR ACTIVE ORDERS
    const activeOrders = await Order.find({
      status: { $in: ["Processing", "In Progress", "Pending", "In progress", "pending"] },
      provider_order_id: { $exists: true, $ne: null }
    });

    if (!activeOrders.length) {
      console.log("No orders currently processing at provider.");
      return;
    }

    await Promise.all(
      activeOrders.map(async (order) => {
        try {
          const result = await checkOrderStatus(order.provider_order_id);
          console.log(`Order ${order.order_id} Provider status:`, result.status);

          if (result.status) {
            const oldStatus = order.status;
            // Normalize status for internal consistency
            let newStatus = result.status;
            if (newStatus.toLowerCase() === "completed") newStatus = "Completed";
            if (newStatus.toLowerCase() === "canceled") newStatus = "Canceled";
            if (newStatus.toLowerCase() === "partial") newStatus = "Partial";
            if (newStatus.toLowerCase() === "processing") newStatus = "In progress";

            // Map provider's "Pending" to "In progress" so we don't downgrade
            if (newStatus.toLowerCase() === "pending") newStatus = "In progress";

            // ✅ FORCE-COMPLETE: If provider says remains = 0, order is done
            // even if provider status hasn't updated to "Completed" yet.
            const remainsCount = parseInt(result.remains, 10);
            if (!isNaN(remainsCount) && remainsCount === 0) {
              newStatus = "Completed";
              console.log(`Order ${order.order_id}: remains = 0 → forcing Completed`);
            }

            // ── STATUS PRIORITY: never downgrade ──
            const STATUS_RANK = { "Pending": 0, "In progress": 1, "Processing": 1, "Completed": 2, "Canceled": 2, "Partial": 2 };
            const currentRank = STATUS_RANK[oldStatus] ?? 0;
            const newRank = STATUS_RANK[newStatus] ?? 0;

            let updated = false;

            if (newRank >= currentRank && oldStatus !== newStatus) {
              order.status = newStatus;
              updated = true;
              console.log(`Updated Order ${order.order_id} status: ${oldStatus} -> ${newStatus}`);

              // If order is now Completed, notify the Website Server
              if (newStatus === "Completed") {
                try {
                  console.log(`Notifying website about completed order ${order.order_id}...`);
                  await axios.post(`${WEBSITE_URL}/api/payment/update`, {
                    orderId: order.order_id,
                    status: "completed",
                    provider_order_id: order.provider_order_id
                  });
                  console.log(`✅ Website notified for order ${order.order_id}`);
                } catch (notifyErr) {
                  console.error(`Failed to notify website for order ${order.order_id}:`, notifyErr.message);
                }
              }
            }

            if (result.start_count !== undefined && order.start_count !== String(result.start_count)) {
                order.start_count = String(result.start_count);
                updated = true;
            }

            if (result.remains !== undefined && order.remains !== String(result.remains)) {
                order.remains = String(result.remains);
                updated = true;
            }

            if (updated) {
                await order.save();
            }
          }

        } catch (err) {
          console.log(`Status check error for order ${order.order_id}:`, err.message);
        }
      })
    );

  } catch (err) {
    console.error("Cron error:", err.message);
  }
});