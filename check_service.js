const axios = require("axios");
const qs = require("qs");
require("dotenv").config({ path: "c:/Users/Hp/Desktop/SSM PANEL/backend/.env" });

const PROVIDER_URL = "https://cheapestsmmpanels.com/api/v2";
const API_KEY = process.env.PROVIDER_API_KEY;

async function checkServices() {
  try {
    const response = await axios.post(
      PROVIDER_URL,
      qs.stringify({
        key: API_KEY,
        action: "services"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const services = response.data;
    const service211 = services.find(s => s.service === "211" || s.service === 211);
    console.log("Service 211 info:", JSON.stringify(service211, null, 2));
    
    // Also log first 5 services just to see the structure
    // console.log("First 5 services:", JSON.stringify(services.slice(0, 5), null, 2));

  } catch (error) {
    console.error("Failed to fetch services:", error.message);
  }
}

checkServices();
