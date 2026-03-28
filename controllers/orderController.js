const {
  create_pickup_order,
  cancel_Order,
} = require("../service/orderService");
const { sendSuccess } = require("../utils/apiResponse");
const { transitionOrderService } = require("../service/transitionOrder");

async function createPickupOrder(req, res) {
  let { order_id, location_code, service_option_hold_id, items, needsWebhook } =
    req.body;
  let user_id = req.user.id;
  let response = await create_pickup_order(
    order_id,
    location_code,
    service_option_hold_id,
    items,
    user_id,
    needsWebhook,
    req.log,
  );
  if (response) {
    sendSuccess(res, "Order Successfully created", { order_id }, 200);
  }
}
async function transitionOrder(req, res) {
  const { order_id, state } = req.body;
  let { id, next_state } = await transitionOrderService(
    order_id,
    state,
    req.log,
  );

  sendSuccess(
    res,
    "Order Transitioned Successfully",
    { order_id: id, state: next_state },
    200,
  );
}
async function cancelOrder(req, res) {
  const { order_id, source = null } = req.body;

  await cancel_Order(order_id, source, req.log);
  sendSuccess(res, "Order Cancelled Successfully", { order_id }, 200);
}

module.exports = { createPickupOrder, transitionOrder, cancelOrder };
