const { sendSuccess } = require("../utils/apiResponse");
const {
  getServiceOptions,
  reserveServiceOption,
} = require("../service/serviceOptionsService");
const { ExpressError } = require("../utils/ExpressError");

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;

  const response = await getServiceOptions(store_id);

  if (response.rowCount > 0) {
    sendSuccess(res, null, response.rows, 200);
  } else {
    throw new ExpressError(
      "No options for this store",
      400,
      "NO_SERVICE_OPTIONS"
    );
  }
}

async function reserveServiceoption(req, res) {
  const { service_option_id } = req.body;
  const user_id = req.user.id;
  const updateServiceOptionsHoldResponse = await reserveServiceOption(
    service_option_id,
    user_id
  );

  sendSuccess(res, "Reserved", updateServiceOptionsHoldResponse.rows[0], 200);
}

module.exports = { pickupServiceOptions, reserveServiceoption };
