const express = require("express"); 
const router = express.Router(); 
const {getdashboarddata} = require("../controller/dashboard");

router.get("/", getdashboarddata);

module.exports = router;
