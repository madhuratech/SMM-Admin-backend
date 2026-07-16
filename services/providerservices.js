const axios = require("axios");
const qs = require("qs");
require("dotenv").config();

const PROVIDER_URL = "https://smmunited.com/api/v2";
const API_KEY = process.env.PROVIDER_API_KEY;


// SEND ORDER TO PROVIDER
async function sendOrder(serviceID, link, quantity, serviceName = "") {

  try {

    if (!API_KEY) {
      throw new Error("Provider API key missing in .env");
    }

    console.log("Sending order to provider...");
    console.log("Service:", serviceID);
    console.log("Link:", link);
    console.log("Qty:", quantity);

    const payload = {
      key: API_KEY,
      action: "add",
      service: serviceID,
      link: link,
      quantity: quantity
    };

    if (serviceName.toLowerCase().includes("comment") || serviceName.toLowerCase().includes("custom")) {
      const genericCommentsList = [
        "Nice post!", "Great!", "Awesome 🔥", "Love this!", "Amazing",
        "So cool", "Looks great", "Perfect", "Wow 😮", "Incredible",
        "Beautiful", "Fantastic", "Superb", "Good job", "Stunning"
      ];
      let generatedComments = [];
      const numComments = parseInt(quantity, 10) || 10;
      for (let i = 0; i < numComments; i++) {
        generatedComments.push(genericCommentsList[i % genericCommentsList.length]);
      }
      payload.comments = generatedComments.join("\r\n");
    }

    console.log("Full Payload:", payload);

    const response = await axios.post(
      PROVIDER_URL,
      qs.stringify(payload),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const data = response.data;

    console.log("Provider response:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.order) {
      throw new Error("Provider did not return order id");
    }

    return data;

  } catch (error) {
    console.error("Provider API Error:", error.message);
    throw error;
  }

}


// CHECK ORDER STATUS
async function checkOrderStatus(orderId) {

  try {

    const response = await axios.post(
      PROVIDER_URL,
      qs.stringify({
        key: API_KEY,
        action: "status",
        order: orderId
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const data = response.data;

    console.log("Provider status response:", data);

    return data;

  } catch (error) {
    console.error("Status check failed:", error.message);
    throw error;
  }

}

module.exports = { sendOrder, checkOrderStatus };