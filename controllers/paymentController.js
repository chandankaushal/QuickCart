const {
  createCheckoutSessionService,
  handleWebhook,
} = require("../service/paymentService");
const { sendError, sendSuccess } = require("../utils/apiResponse");
const { InternalServerError } = require("../utils/ExpressError");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

async function createCheckoutSession(req, res) {
  const { order_id, amount } = req.body;
  const session = await createCheckoutSessionService(order_id, amount, req.log);
  res.json({
    message: "Please Click on the link below to complete payment",
    url: session.url,
  });
}

async function handleStripeWebhook(req, res) {
  let event;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      );
    } catch (err) {
      req.log.warn({ err }, `⚠️ Webhook signature verification failed.`);
      return sendError(res, "WebhookVerificationFailed", 400);
    }
    await handleWebhook(event, req.log);
  } else {
    throw new InternalServerError();
  }
  sendSuccess(res, null, { received: true }, 200);
}

module.exports = { createCheckoutSession, handleStripeWebhook };
