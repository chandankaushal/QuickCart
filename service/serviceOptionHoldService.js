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

async function markServiceOptionHoldTaken(id) {
  let response = await ServiceOptionHold.updateServiceOptionHold(id);
  console.log(`Service Option Hold${response}`);
  if (response.rowCount === 0) {
    throw new ExpressError(
      "Service Option Hold not found. Please try again later",
      400,
      "NOT_FOUND"
    );
  }
  return response;
}

module.exports = { isServiceOptionHoldValid, markServiceOptionHoldTaken };
