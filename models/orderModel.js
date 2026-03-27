const pool = require("../db");

const ORDERS_TABLE = `"quickcart".orders`;

const Order = {
  async create(
    order_id,
    service_type,
    store_id,
    service_option_hold_id,
    user_id,
    order_total,
    client = null,
  ) {
    let sql = `INSERT INTO ${ORDERS_TABLE} (id,service_type,service_option_hold_id,user_id,store_id,order_total) VALUES ($1,$2,$3,$4,$5,$6)`;
    let params = [
      order_id,
      service_type,
      service_option_hold_id,
      user_id,
      store_id,
      order_total,
    ];
    if (client) {
      let response = await client.query(sql, params);
      return response;
    } else {
      let response = await pool.query(sql, params);
      return response;
    }
  },
  async getStateById(order_id, client = null) {
    let sql = `SELECT state FROM ${ORDERS_TABLE} WHERE id = $1`;
    let params = [order_id];
    if (client) {
      let response = await client.query(sql, params);
      return response;
    }

    let response = await pool.query(sql, params);
    return response;
  },
  async transitionStateById(order_id, state, client = null) {
    let sql = `UPDATE ${ORDERS_TABLE} SET state = $1 WHERE id = $2 AND state <> $3`;

    let params = [state, order_id, state];
    if (client) {
      let response = await client.query(sql, params);
      return response;
    }

    let response = await pool.query(sql, params);
    return response;
  },
  async getById(order_id) {
    let sql = `SELECT * FROM ${ORDERS_TABLE} WHERE id = $1`;
    let params = [order_id];

    const response = await pool.query(sql, params);

    return response.rows;
  },
};

module.exports = Order;
