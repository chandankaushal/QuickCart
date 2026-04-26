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
    const runner = client || pool;
    return await runner.query(sql, params);
  },
  async getExpiredHolds(client = null) {
    const date = new Date();
    const now = new Date();
    const sql = `SELECT * FROM ${service_options_hold_table} WHERE expires_at <= $1 AND is_option_taken = $2`;
    const values = [now, false];

    const runner = client || pool;
    return await runner.query(sql, values);
  },
  async delete(id, client = null) {
    const hold_ids = Array.isArray(id) ? id : [id];
    const sql = `DELETE from ${service_options_hold_table} WHERE is_option_taken = $1 AND service_option_hold_id =  ANY ($2::int[])`;
    const values = [false, hold_ids];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
};

module.exports = ServiceOptionHold;
