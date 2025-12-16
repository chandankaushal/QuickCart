const { sendError, sendSuccess } = require("../utils/apiResponse");
const ServiceOptions = require("../service/serviceOptionsService");

async function pickupServiceOptions(req, res) {
  console.log("Here");
  const { store_id } = req.body;
  if (!store_id) {
    sendError(res, `Field Missing store_id`, 400);
  }

  const response = await ServiceOptions.getServiceOptions(store_id);

  response.rowCount > 0
    ? sendSuccess(res, null, response.rows, 200)
    : sendError(res, "No options for this store", 400);
}

async function reserveServiceoption(req, res) {
  const { service_option_id } = req.body;
  const user_id = req.user.id;
  const updateServiceOptionsHoldResponse =
    await ServiceOptions.reserveServiceOption(service_option_id, user_id);

  sendSuccess(res, "Reserved", updateServiceOptionsHoldResponse.rows[0], 200);
}

module.exports = { pickupServiceOptions, reserveServiceoption };
