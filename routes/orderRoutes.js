const express = require("express");
const router = express.Router();
const {
  createPickupOrder,
  transitionOrder,
} = require("../controllers/orderController");
const wrapAsync = require("../utils/wrapAsync");
const { checkValidToken } = require("../middleware/auth");
const { orderSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/pickup/create_order",
  validateBody(orderSchema),
  checkValidToken,
  wrapAsync(createPickupOrder),
);
//router.post("/cancel_order") // Cancel Order
router.post("/transition_order", wrapAsync(transitionOrder));

module.exports = router;
