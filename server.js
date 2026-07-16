const express = require("express");
require("dotenv").config();

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
app.use(cors());

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