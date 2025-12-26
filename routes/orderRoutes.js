const express = require("express");
const router = express.Router();
const { createPickupOrder } = require("../controllers/orderController");
const wrapAsync = require("../utils/wrapAsync");
const { checkValidToken } = require("../middleware/auth");
const { orderSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/pickup/create_order",
  validateBody(orderSchema),
  checkValidToken,
  wrapAsync(createPickupOrder)
);

module.exports = router;
