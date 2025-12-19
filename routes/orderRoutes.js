const express = require("express");
const router = express.Router();
const { createPickupOrder } = require("../controllers/orderController");
const wrapAsync = require("../utils/wrapAsync");
const { checkValidToken } = require("../middleware/auth");

router.post(
  "/pickup/create_order",
  checkValidToken,
  wrapAsync(createPickupOrder)
);

module.exports = router;
