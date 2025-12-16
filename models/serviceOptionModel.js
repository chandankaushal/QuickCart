const pool = require("../db");
const { ExpressError } = require("../utils/ExpressError");

const service_options_table = `"quickcart".service_options`;
const service_options_hold_table = `"quickcart".service_options_holds`;

const ServiceOptions = {
  async getServiceOptions(store_id) {
    let sql = `SELECT * FROM ${service_options_table} WHERE store_id = $1 AND available=$2`;
    let values = [store_id, true];
    let response = await pool.query(sql, values);
    return response;
  },
  async reserveServiceOption(service_option_id, user_id) {
    let checkOptionsql = `SELECT available FROM ${service_options_table} WHERE service_option_id = $1`;
    let checkOptionValue = [service_option_id];
    let { rows } = await pool.query(checkOptionsql, checkOptionValue);
    if (!rows[0].available) {
      throw new ExpressError(
        "This service Option is already taken",
        400,
        "SERVICE_OPTION_ALREADY_TAKEN"
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
    return updateServiceOptionsHoldResponse;
  },
};

module.exports = ServiceOptions;
