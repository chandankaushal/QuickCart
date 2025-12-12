const pool = require("../db");

const STORES_TABLE = `quickcart.stores`;

const Stores = {
  async getAll() {
    let sql = `SELECT * FROM ${STORES_TABLE}`;
    let response = await pool.query(sql);
    return response.rows;
  },
  async getStoresByZip(zip_code, street = null) {
    let sql = `SELECT store_id,name,zip_code FROM ${STORES_TABLE} WHERE zip_code = $1`;
    const params = [zip_code];

    if (street) {
      sql += " AND street ILIKE $2";
      params.push(`%${street}%`);
    }
    let response = await pool.query(sql, params);
    return response;
  },
};

module.exports = { Stores };
