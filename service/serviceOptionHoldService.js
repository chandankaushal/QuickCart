const ServiceOptionHold = require("../models/serviceOptionsHoldModel");
const { ExpressError } = require("../utils/ExpressError");

async function isServiceOptionHoldValid(id) {
  let { expires_at, created_at } = await ServiceOptionHold.holdById(id);

  const ends = new Date(expires_at);
  const starts = new Date(created_at);

  if (ends <= starts) {
    throw new ExpressError(
      "END TIME MUST BE AFTER START TIME",
      500,
      "SERVICE_OPTIONS_HOLD_DB"
    );
  }

  const diff = ends - starts;
  const diffMinutes = diff / (1000 * 60);

  if (diffMinutes > 10) {
    throw new ExpressError(
      "Service Option Hold is Expired. Please create a new one",
      400,
      "HOLD_EXPIRED"
    );
  }
  return true;
}

async function markServiceOptionHoldTaken(id) {
  let response = await ServiceOptionHold.updateServiceOptionHold(id);
  if (response.rowCount === 0) {
    throw new ExpressError("Service Option Hold Not Found", 400, "NOT_FOUND");
  }
  return response;
}

module.exports = { isServiceOptionHoldValid, markServiceOptionHoldTaken };
