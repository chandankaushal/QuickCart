const express = require("express");
const router = express.Router();
const { createPickupOrder } = require("../controllers/orderController");

router.post("/createPickupOrder", createPickupOrder);

module.exports = router;
