const { Stores } = require("../models/storeModel");
const { ExpressError } = require("../utils/ExpressError");
const {
  isServiceOptionHoldValid,
  markServiceOptionHoldTaken,
} = require("./serviceOptionHoldService");
const Product = require("../service/productService");
const Order = require("../models/orderModel");
const { checkProductStock } = require("../service/productService");
async function create_pickup_order(
  order_id,
  store_id,
  service_option_hold_id,
  items,
  user_id
) {
  //check if the location is exists
  const storeId = Number(store_id);
  console.log(store_id);

  if (!Number.isInteger(store_id)) {
    throw new ExpressError("Invalid store id", 400, "INVALID_STORE_ID");
  }
  console.log("Checking if store exists");
  let storeResponse = await Stores.getStoreById(storeId);
  if (storeResponse.length === 0) {
    throw new ExpressError(
      "No Stores found for this location code",
      400,
      "NO_STORES_FOUND"
    );
  }
  //check if the hold is not expired
  console.log("Checking if hold is valid");
  let isholdValid = await isServiceOptionHoldValid(service_option_hold_id);

  //check if the items are available
  console.log("checking if products are available");
  const isProductAvailable = await checkProductStock(items, store_id);
  if (isProductAvailable.problems) {
    throw new ExpressError(
      `UPC ${isProductAvailable.data.map((el) => el.upc).join(",")}`,
      400,
      "ITEM_NOT_FOUND"
    );
  }
  //Mark the hold as expired

  log.info("marking the hold as expired");
  let expired_hold_response = await markServiceOptionHoldTaken(
    service_option_hold_id
  );

  // Subtract the items from Products table
  //TO-DO
  console.log("adjusting stock");

  // put the order in the DB
  const orderResponse = await Order.pickupOrder(
    order_id,
    store_id,
    service_option_hold_id,
    user_id
  );

  if (orderResponse.rowCount == 1 && orderResponse.command === "INSERT") {
    return orderResponse;
  } else {
    throw new ExpressError(
      "There were some issues creating your order",
      500,
      "INTERNAL_SERVER_ERROR"
    );
  }
}

module.exports = { create_pickup_order };
