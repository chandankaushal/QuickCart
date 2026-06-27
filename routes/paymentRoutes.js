const express = require("express");
const {
  createCheckoutSession,
  handleStripeWebhook,
} = require("../controllers/paymentController");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");

router.post("/create-checkout-session", wrapAsync(createCheckoutSession));

// The express.raw middleware keeps the request body unparsed;
// this is necessary for the signature verification process
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  wrapAsync(handleStripeWebhook),
);

module.exports = router;
