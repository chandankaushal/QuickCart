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
  async getStateById(order_id, client = null) {
    let sql = `SELECT state FROM ${ORDERS_TABLE} WHERE id = $1`;
    let params = [order_id];
    if (client) {
      console.log("Looking up order using client");
      let response = await client.query(sql, params);
      return response;
    }
    console.log("Looking up order using pool");
    let response = await pool.query(sql, params);
    return response;
  },
  async transitionStateById(order_id, state, client = null) {
    let sql = `UPDATE ${ORDERS_TABLE} SET state = '${state}' WHERE id = $1`;

    let params = [order_id];
    if (client) {
      let response = await client.query(sql, params);
      return response;
    }

    let response = await pool.query(sql, params);
    return response;
  },
};

module.exports = Order;
