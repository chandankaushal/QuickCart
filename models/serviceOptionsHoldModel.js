const pool = require("../db");

const service_options_hold_table = `"quickcart".service_options_holds`;

const ServiceOptionHold = {
  async holdById(id) {
    let sql = `SELECT * from ${service_options_hold_table} WHERE service_option_hold_id = $1`;
    let params = [id];
    let result = await pool.query(sql, params);
    return result.rows[0];
  },
  async updateServiceOptionHold(id, client = null) {
    let sql = `UPDATE ${service_options_hold_table} SET is_option_taken = $1 WHERE service_option_hold_id = $2 AND is_option_taken = $3  `;
    let params = [true, id, false];
    if (client) {
      // console.log("Updating Service Option Hold with client");
      let response = await client.query(sql, params);
      return response;
    } else {
      // console.log("Updating Service Option Hold with Pool");
      let response = await pool.query(sql, params);
      return response;
    }

    // const response = client
    //   ? await client.query(sql, params)
    //   : await pool.query(sql, params);

    //return response;
  },
};

module.exports = ServiceOptionHold;
