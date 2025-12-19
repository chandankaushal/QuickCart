const ServiceOptionHold = require("../models/serviceOptionsHoldModel");
const { ExpressError } = require("../utils/ExpressError");

async function isServiceOptionHoldValid(id) {
  let { expires_at } = await ServiceOptionHold.holdById(id);

  const expiresAt = new Date(expires_at);
  const now = new Date();

  if (now > expiresAt) {
    throw new ExpressError(
      "Service Options hold is expired",
      400,
      "SERVICE_OPTIONS_HOLD_EXPIRED"
    );
  }
  return true;
}

module.exports = { isServiceOptionHoldValid };
