const {
  ServiceOptionHoldNotFoundError,
  ServiceOptionHoldExpiredError,
} = require("../errors/serviceOptionError");
const ServiceOptionHold = require("../models/serviceOptionsHoldModel");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

async function isServiceOptionHoldValid(id, log = logger) {
  log.info("checking if the hold is not expired");
  let { expires_at } = await ServiceOptionHold.holdById(id);

  if (!expires_at) {
    throw new ServiceOptionHoldNotFoundError();
  }
  log.info({ service_option_hold_id: id }, "Service Option Hold is valid");

  const expiresAt = new Date(expires_at);
  const now = new Date();

  if (now > expiresAt) {
    throw new ServiceOptionHoldExpiredError();
  }
  return true;
}

async function markServiceOptionHoldTaken(id, client = null, log = logger) {
  log.info({ service_option_hold_id: id }, "Marking hold as expired");
  let response = await ServiceOptionHold.updateServiceOptionHold(id, client);

  if (response.rowCount === 0) {
    throw new ServiceOptionHoldNotFoundError();
  }
  log.info({ service_option_hold_id: id }, "Marked Service Option Hold Taken");
  return response;
}

module.exports = { isServiceOptionHoldValid, markServiceOptionHoldTaken };
