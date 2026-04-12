const express = require("express");
const router = express.Router();
const {
  createPickupOrder,
  transitionOrder,
  cancelOrder,
  getOrder,
  updateOrder,
} = require("../controllers/orderController");
const wrapAsync = require("../utils/wrapAsync");
const { checkValidToken, checkOrderOwner } = require("../middleware/auth");
const {
  orderSchema,
  cancelOrderSchema,
  transitionOrderSchema,
  getOrderSchema,
} = require("../models/joiSchema");
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
  checkOrderOwner,
  wrapAsync(cancelOrder),
); // Cancel Order
router.post(
  "/transition_order",
  validateBody(transitionOrderSchema),
  checkValidToken,
  checkOrderOwner,
  wrapAsync(transitionOrder),
);
router.post(
  "/getOrder",
  validateBody(getOrderSchema),
  checkValidToken,
  checkOrderOwner,
  wrapAsync(getOrder),
);
router.put("/updateOrder", updateOrder);

module.exports = router;
