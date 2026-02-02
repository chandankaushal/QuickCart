const Order = require("../models/orderModel");
const ORDER_STATES = require("../utils/eventTypes");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");
const sendWebhook = require("../utils/sendWebhook");
const withTransaction = require("../utils/withTransaction");
async function transitionOrderService(id, state = null, log = logger) {
  // Look-up Order current state from DB
  log.info("Looking up Order in DB");
  const { rows } = await Order.getStateById(id);
  let current_state = rows[0].state;
  log.info(`Current State ${current_state}`);
  if (current_state === "delivered") {
    throw new ExpressError(
      "Order is already delivered",
      400,
      "ORDER_ALREADY_DELIVERED",
    );
  }
  let idx = ORDER_STATES.ORDER_STATES.indexOf(current_state);
  let next_state;
  if (!state) {
    // Transition to next one
    next_state = ORDER_STATES.ORDER_STATES[idx + 1];
    log.info(`Next State for Order ${id} is ${next_state}`);
  } else {
    log.info(`Next State for Order ${id} is ${next_state}`);
    next_state = state;
  }

  const withTransactionResponse = await withTransaction(async (client) => {
    await Order.transitionStateById(id, next_state, client);
    log.info(
      `Sending Webhook of type ${ORDER_STATES.ORDER_EVENT_TYPES.ORDER_UPDATED} to OMS `,
    );
    await sendWebhook(
      { id, state: next_state },
      ORDER_STATES.ORDER_EVENT_TYPES.ORDER_UPDATED,
      log,
    );

    return { id, next_state };
  });
  return withTransactionResponse;
}

module.exports = { transitionOrderService };
