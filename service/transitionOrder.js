const Order = require("../models/orderModel");
const sendToQueue = require("../queues/sendToQueue");
const ORDER_STATES = require("../utils/eventTypes");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");
const withTransaction = require("../utils/withTransaction");
const EVENT_GROUP_TYPES = require("../queues/eventGroupTypes");

async function transitionOrderService(
  id,
  state = null,
  source = null,
  log = logger,
) {
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
  } else if (current_state === "cancelled") {
    throw new ExpressError(
      "Order is already cancelled",
      400,
      "ORDER_ALREADY_CANCELLED",
    );
  }
  let idx = ORDER_STATES.ORDER_STATES.indexOf(current_state);
  let next_state;
  if (!state) {
    // Transition to next one
    next_state = ORDER_STATES.ORDER_STATES[idx + 1];
    log.info(`Next State for Order ${id} is ${next_state}`);
  } else {
    next_state = state;
    log.info(`Next State for Order ${id} is ${next_state}`);
  }

  const withTransactionResponse = await withTransaction(async (client) => {
    await Order.transitionStateById(id, next_state, client);
    log.info(
      `Sending Webhook of type ${ORDER_STATES.ORDER_EVENT_TYPES.ORDER_UPDATED} to OMS `,
    );
    if (source === "OMS") {
      log.info("No Need to send webhook as order is being cancelled from OMS");
      return { id, next_state };
    }
    // Move this to Queue
    log.info(
      { order_id: id, eventGroup: EVENT_GROUP_TYPES.ORDER_UPDATED },
      "Adding Order Update to SQS",
    );
    await sendToQueue(
      { id, state: next_state },
      EVENT_GROUP_TYPES.ORDER_UPDATED,
    );

    return { id, next_state };
  });
  return withTransactionResponse;
}

module.exports = { transitionOrderService };
