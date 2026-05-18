const pool = require("../db");
const service_options_table = `"quickcart".service_options`;
const service_options_hold_table = `"quickcart".service_options_holds`;

const ServiceOptions = {
  async getById(service_option_id) {
    let sql = `SELECT * FROM ${service_options_table} WHERE service_option_id = $1`;
    let value = [service_option_id];
    let { rows } = await pool.query(sql, value);
    return rows;
  },
  async getServiceOptions(store_id) {
    let sql = `SELECT * FROM ${service_options_table} WHERE store_id = $1 AND available=$2`;
    let values = [store_id, true];
    let response = await pool.query(sql, values);
    return response;
  },
  async serviceOptionAvailableById(service_option_id) {
    let checkOptionsql = `SELECT available FROM ${service_options_table} WHERE service_option_id = $1`;
    let checkOptionValue = [service_option_id];
    let { rows } = await pool.query(checkOptionsql, checkOptionValue);
    return rows;
  },
  async reserveServiceOption(service_option_id, user_id) {
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
      updateServiceOptionsHoldvalue,
    );
    return updateServiceOptionsHoldResponse;
  },
  async getPickupWindowByHoldId(hold_id) {
    const sql = `
      SELECT so.starts_at, so.ends_at, so.service_option_id
      FROM ${service_options_hold_table} h
      INNER JOIN ${service_options_table} so
        ON so.service_option_id = h.service_option_id
      WHERE h.service_option_hold_id = $1
    `;
    const { rows } = await pool.query(sql, [hold_id]);
    return rows;
  },
  async getStoreForServiceOption(service_option_id) {
    const sql = `SELECT store_id FROM ${service_options_table} WHERE service_option_id = $1`;
    const values = [service_option_id];
    const result = await pool.query(sql, values);
    return result.rows;
  },
  async releaseServiceOption(service_option_id, client = null) {
    const ids = Array.isArray(service_option_id)
      ? service_option_id
      : [service_option_id];
    const sql = `UPDATE ${service_options_table} SET available = $1 WHERE service_option_id = ANY($2::int[]) AND available = $3`;
    const values = [true, ids, false];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
};

module.exports = ServiceOptions;
