const pool = require("../db");

const CHECKOUT_SESSIONS_TABLE = `quickcart.checkout_sessions`;

const checkout_session = {
  async add(information) {
    const sql = `INSERT INTO ${CHECKOUT_SESSIONS_TABLE}  (id, created_at,amount,order_id,currency,status) VALUES ($1,to_timestamp($2),$3,$4,$5,$6)`;
    const values = [
      information.id,
      information.created_at,
      information.amount,
      information.order_id,
      information.currency,
      information.status,
    ];

    const response = await pool.query(sql, values);

    return response;
  },
  async update(id, status) {
    const sql = `UPDATE ${CHECKOUT_SESSIONS_TABLE} SET status = $1 WHERE id = $2`;
    const values = [status, id];
    return await pool.query(sql, values);
  },
};

module.exports = checkout_session;
