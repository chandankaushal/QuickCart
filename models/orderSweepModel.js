const pool = require("../db");

const ORDERS_TABLE = `"quickcart".orders`;
const CHECKOUT_SESSIONS_TABLE = `quickcart.checkout_sessions`;

const OrderSweep = {
  // Orders still awaiting payment whose most recent checkout session was
  // created more than `minutes` ago and was never paid.
  async getStaleAwaitingPayment(minutes, client = null) {
    const sql = `
      SELECT o.id AS order_id,
             MAX(cs.created_at) AS last_session_at
      FROM ${ORDERS_TABLE} o
      JOIN ${CHECKOUT_SESSIONS_TABLE} cs ON cs.order_id = o.id
      WHERE o.state = 'awaiting_payment'
        AND cs.status <> 'paid'
      GROUP BY o.id
      HAVING MAX(cs.created_at) <= now() - make_interval(mins => $1)`;
    const runner = client || pool;
    const { rows } = await runner.query(sql, [minutes]);
    return rows;
  },

  // Race-safe cancel: only transitions awaiting_payment -> cancelled, so an
  // order that was paid (moved to brand_new by the webhook) in the meantime is
  // left untouched. Caller must check rowCount before restocking.
  async cancelIfAwaitingPayment(order_id, client = null) {
    const sql = `UPDATE ${ORDERS_TABLE}
                 SET state = 'cancelled'
                 WHERE id = $1 AND state = 'awaiting_payment'`;
    const runner = client || pool;
    return await runner.query(sql, [order_id]);
  },
};

module.exports = OrderSweep;
