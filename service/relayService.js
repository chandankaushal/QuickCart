const sendWebhook = require("../utils/sendWebhook");

async function createOmsOrder(order) {
  return await sendWebhook(order, "ORDER_CREATED");
}
// TO-DO Transition
// async function updateOmsOrder(order, update_type) {

// }

module.exports = createOmsOrder;
