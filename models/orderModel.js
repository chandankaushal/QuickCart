const pool = require("../db");

const ORDERS_TABLE = `"quickcart".orders`;

const Order = {
  async pickupOrder(
    order_id,
    store_id,
    service_option_hold_id,
    user_id,
    client = null,
  ) {
    let sql = `INSERT INTO ${ORDERS_TABLE} (id,service_option_hold_id,user_id,store_id) VALUES ($1,$2,$3,$4)`;
    let params = [order_id, service_option_hold_id, user_id, store_id];
    if (client) {
      // console.log("Creating Order with Client");
      let response = await client.query(sql, params);
      return response;
    } else {
      // console.log("Creating Order with Pool");
      let response = await pool.query(sql, params);
      return response;
    }
  },
};

module.exports = Order;
