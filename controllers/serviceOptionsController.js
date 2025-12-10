const pool = require("../db");
const { sendError, sendSuccess } = require("../utils/apiResponse");

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;
  if (!store_id) {
    sendError(res, `Field Missing store_id`, 400);
  }
}

module.exports = pickupServiceOptions;
