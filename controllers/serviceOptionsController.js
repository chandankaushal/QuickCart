const pool = require("../db");
const { sendError, sendSuccess } = require("../utils/apiResponse");

const service_options_table = `"quickcart".service_options`;
const service_options_hold_table = `"quickcart".service_options_holds`;

async function pickupServiceOptions(req, res) {
  const { store_id } = req.body;
  if (!store_id) {
    sendError(res, `Field Missing store_id`, 400);
  }

  let sql = `SELECT * FROM ${service_options_table} WHERE store_id = $1 AND available=$2`;
  let values = [store_id, true];
  let response = await pool.query(sql, values);
  //console.log(response.rows);
  sendSuccess(res, null, response.rows, 200);
}

async function reserveServiceoption(req, res) {
  const { service_option_id } = req.body;
  const user_id = req.user.id;
  //Only Reserve if the option has available flag true;
  let checkOptionsql = `SELECT available FROM ${service_options_table} WHERE service_option_id = $1`;
  let checkOptionValue = [service_option_id];
  let isOptionAvailable = await pool.query(checkOptionsql, checkOptionValue);

  if (!isOptionAvailable.rows[0].available) {
    return sendError(
      res,
      "Service Option is already taken, please select a new one",
      400
    );
  }

  let updateServiceOptionSql = `UPDATE ${service_options_table} SET available=$1 WHERE service_option_id = $2`;
  let updateServiceOptionValue = [false, service_option_id];
  await pool.query(updateServiceOptionSql, updateServiceOptionValue); // Update service options table and set that option as not available

  const updateServiceOptionsHoldsql = `
      INSERT INTO ${service_options_hold_table} (service_option_id, user_id)
      VALUES ($1, $2)
      RETURNING *;
    `;
  const updateServiceOptionsHoldvalue = [service_option_id, user_id];
  const updateServiceOptionsHoldResponse = await pool.query(
    updateServiceOptionsHoldsql,
    updateServiceOptionsHoldvalue
  );

  // 3) Send success with hold info (including id + expires_at)
  sendSuccess(res, "Reserved", updateServiceOptionsHoldResponse.rows[0], 200);
}

module.exports = { pickupServiceOptions, reserveServiceoption };
