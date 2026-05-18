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
    const runner = client || pool;
    return await runner.query(sql, params);
  },
  async getStateById(order_id, client = null) {
    let sql = `SELECT state FROM ${ORDERS_TABLE} WHERE id = $1`;
    let params = [order_id];
    const runner = client || pool;
    return await runner.query(sql, params);
  },
  async transitionStateById(order_id, state, client = null) {
    let sql = `UPDATE ${ORDERS_TABLE} SET state = $1 WHERE id = $2 AND state <> $3`;

    let params = [state, order_id, state];
    const runner = client || pool;
    return await runner.query(sql, params);
  },
  async getById(order_id) {
    let sql = `SELECT * FROM ${ORDERS_TABLE} WHERE id = $1`;
    let params = [order_id];

    const response = await pool.query(sql, params);

    return response.rows;
  },
  async UpdateServiceOptionAndTotal(updatePayload) {
    // (id,service_type,service_option_hold_id,user_id,store_id,order_total)
    const sql = `UPDATE ${ORDERS_TABLE} SET service_option_hold_id = $1 order_total = $2`; //BUG
    let values = [
      updatePayload.service_option_hold_id,
      updatePayload.new_total,
    ];
  },
  async updateTotal(new_total, order_id, client = null) {
    const sql = `UPDATE ${ORDERS_TABLE} SET order_total = $1 WHERE id =  $2`;
    const values = [new_total, order_id];

    let runner = client || pool;

    return await runner.query(sql, values);
  },
  async updateServiceOptionHoldId(hold_id, order_id, client = null) {
    const sql = `UPDATE ${ORDERS_TABLE} SET service_option_hold_id = $1 WHERE id = $2`;
    const values = [hold_id, order_id];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
};

module.exports = Order;
