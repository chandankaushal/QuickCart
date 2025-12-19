const pool = require("../db");
const { ExpressError } = require("../utils/ExpressError");

const service_options_hold_table = `"quickcart".service_options_holds`;

const ServiceOptionHold = {
  async holdById(id) {
    let sql = `SELECT * from ${service_options_hold_table} WHERE service_option_hold_id = $1`;
    let params = [id];
    let result = await pool.query(sql, params);
    return result.rows[0];
  },
};

module.exports = ServiceOptionHold;
