const { ExpressError } = require("../utils/ExpressError");

class CouldNotCompletePaymentError extends ExpressError {
  constructor() {
    super("Could not complete payment for this order", 500, "PAYMENT_ERROR");
  }
}
class StripeWebhookSecretError extends ExpressError {
  constructor() {
    super("Missing or invalid Webhook Secret", 401, "UNAUTHORIZED");
  }
}

module.exports = { CouldNotCompletePaymentError, StripeWebhookSecretError };
