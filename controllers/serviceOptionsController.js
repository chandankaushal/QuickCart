const pool = require("../db");
const { sendError, sendSuccess } = require("../utils/apiResponse");

const service_options_table = `"quickcart".service_options`;

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;
  if (!store_id) {
    sendError(res, `Field Missing store_id`, 400);
  }

  let sql = `SELECT * FROM ${service_options_table} WHERE store_id = $1 AND available=$2`;
  let values = [store_id, true];
  let response = await pool.query(sql, values);
  console.log(response.rows);
  sendSuccess(res, null, response.rows, 200);
}

async function reserveServiceoption(req, res) {
  const { service_option_id } = req.body;

  let sql = `UPDATE ${service_options_table} SET available=$1 WHERE service_option_id = $2`;
  let values = [false, service_option_id];

  let response = await pool.query(sql, values);
  sendSuccess(res, "Reserved", null, 200);
}

module.exports = { pickupServiceOptions, reserveServiceoption };
