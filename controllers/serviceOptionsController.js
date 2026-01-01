const { sendSuccess } = require("../utils/apiResponse");
const {
  getServiceOptions,
  reserveServiceOption,
} = require("../service/serviceOptionsService");
const { ExpressError } = require("../utils/ExpressError");

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;

  const service_options = await getServiceOptions(store_id, req.log);

  sendSuccess(res, null, service_options, 200);
}

async function reserveServiceoption(req, res) {
  const { service_option_id } = req.body;
  const user_id = req.user.id;
  const service_option_hold_info = await reserveServiceOption(
    service_option_id,
    user_id,
    req.log
  );

  if (!service_option_hold_info || service_option_hold_info.length === 0) {
    throw new ExpressError(
      "There was a problem in reserving the service option, please try another one",
      500,
      "SERVICE_OPTION_RESERVE_ERROR"
    );
  }
  sendSuccess(res, "Reserved", service_option_hold_info, 200);
}

module.exports = { pickupServiceOptions, reserveServiceoption };
