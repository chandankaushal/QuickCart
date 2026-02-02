async function createOmsOrder(order) {
  await sendWebhook(order, "ORDER_CREATED");
}
// TO-DO Transition
// async function updateOmsOrder(order, update_type) {

// }

module.exports = createOmsOrder;
