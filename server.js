const path = require("path");
const fs = require("fs");

const nodeEnv = process.env.NODE_ENV || "development";
const envFilePath = path.resolve(__dirname, `.env.${nodeEnv}`);

if (fs.existsSync(envFilePath)) {
  require("dotenv").config({ path: envFilePath });
}
require("dotenv").config(); // Fallback to default .env

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const getorder = require("./routes/orderroutes");
const dashboardstatus = require("./routes/dashboardroutes");
const authRoutes = require("./routes/authroutes");
const priceRoutes = require("./routes/priceroutes");
const supplierRoutes = require("./routes/supplierroutes");
const serviceRoutes = require("./routes/serviceroutes");
const platformRoutes = require("./routes/platformroutes");

require("./services/orderstatus");

const app = express();

// DATABASE
connectDB();

// MIDDLEWARE
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(url => url.trim())
  : ["http://localhost:5174", "http://localhost:5173", "https://admin.tikytop.com", "https://tikytop.com"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json());


// API ROUTES
app.use("/api/orders", getorder);
app.use("/api/dashboard", dashboardstatus);
app.use("/api/auth", authRoutes);
app.use("/api/priceset", priceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/platforms", platformRoutes);


// HEALTH CHECK
app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "Backend Running"
  });

});


// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(`Server running on port ${PORT}`);

});