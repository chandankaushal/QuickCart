const ServiceOptionHold = require("../models/serviceOptionsHoldModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function isServiceOptionHoldValid(id, log = logger) {
  let { expires_at } = await ServiceOptionHold.holdById(id);

  if (!expires_at) {
    throw new ExpressError(
      "Service option hold not found",
      404,
      "SERVICE_OPTION_HOLD_NOT_FOUND"
    );
  }
  log.info({ service_option_hold_id: id }, "Service Option Hold is valid");

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

async function markServiceOptionHoldTaken(id, client = null) {
  let response = await ServiceOptionHold.updateServiceOptionHold(id);

  if (response.rowCount === 0) {
    throw new ExpressError(
      "Service Option Hold not found. Please try again later",
      400,
      "NOT_FOUND"
    );
  }
  log.info({ service_option_hold_id: id }, "Marked Service Option Hold Taken");
  return response;
}

module.exports = { isServiceOptionHoldValid, markServiceOptionHoldTaken };
