const { sendSuccess } = require("../utils/apiResponse");
const {
  getServiceOptions,
  reserveServiceOption,
} = require("../service/serviceOptionsService");

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;

  const service_options = await getServiceOptions(store_id, req.log);

  sendSuccess(res, null, service_options, 200);
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
