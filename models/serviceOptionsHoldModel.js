const pool = require("../db");
const { ExpressError } = require("../utils/ExpressError");
const { updateProductAvailability } = require("./productModel");

const service_options_hold_table = `"quickcart".service_options_holds`;

const ServiceOptionHold = {
  async holdById(id) {
    let sql = `SELECT * from ${service_options_hold_table} WHERE service_option_hold_id = $1`;
    let params = [id];
    let result = await pool.query(sql, params);
    return result.rows[0];
  },
  async updateServiceOptionHold(id) {
    let sql = `UPDATE ${service_options_hold_table} SET is_option_taken = $1 WHERE service_option_hold_id = $2  `;
    let params = [true, id];
    const response = await pool.query(sql, params);
    return response;
  },
};

module.exports = ServiceOptionHold;
