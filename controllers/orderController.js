const { create_pickup_order } = require("../service/orderService");
const { sendSuccess } = require("../utils/apiResponse");

async function createPickupOrder(req, res) {
  let { order_id, location_code, service_option_hold_id, items } = req.body;
  //   console.log("controller");
  console.log("Executing Controller");
  let user_id = req.user.id;
  let response = await create_pickup_order(
    order_id,
    location_code,
    service_option_hold_id,
    items,
    user_id,
    req.log
  );
  if (response) {
    sendSuccess(res, "Order Successfully created", { order_id }, 200);
  }
}

module.exports = { createPickupOrder };
