const express = require("express");
const router = express.Router();
const {
  createPickupOrder,
  transitionOrder,
  cancelOrder,
} = require("../controllers/orderController");
const wrapAsync = require("../utils/wrapAsync");
const { checkValidToken, checkOwner } = require("../middleware/auth");
const { orderSchema, cancelOrderSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/pickup/create_order",
  validateBody(orderSchema),
  checkValidToken,
  wrapAsync(createPickupOrder),
);
router.post(
  "/cancel",
  validateBody(cancelOrderSchema),
  checkValidToken,
  checkOwner,
  wrapAsync(cancelOrder),
); // Cancel Order
router.post("/transition_order", wrapAsync(transitionOrder));

module.exports = router;
