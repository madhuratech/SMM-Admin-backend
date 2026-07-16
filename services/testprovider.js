const axios = require("axios");
const qs = require("qs");

const API_KEY = "65214b97aff87ee1fd36327e2f1d8039";
const API_URL = "https://cheapestsmmpanels.com/api/v2";

async function testServices() {

  try {

    // 1️⃣ GET SERVICES LIST
    const services = await axios.post(
      API_URL,
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

    console.log("Available services:");
    console.log(services.data);


    // 2️⃣ SEND TEST ORDER
    const order = await axios.post(
      API_URL,
      qs.stringify({
        key: API_KEY,
        action: "add",
        service: 647,
        link: "https://www.instagram.com/p/C-pcJkgvtyr/",
        quantity: 50
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );
  
    console.log("Order response:");
    console.log(order.data);



      const youtubeOrder = await axios.post(
      API_URL,
      qs.stringify({
        key: API_KEY,
        action: "add",
        service: 1425, // YouTube Likes (check correct ID)
        link: "https://www.youtube.com/watch?v=2Hb1C9na7Io",
        quantity: 50
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );


    console.log("Order response:");
    console.log(youtubeOrder.data);

  } catch (error) {

    console.error(
      "API Error:",
      error.response?.data || error.message
    );

  }

}

testServices();