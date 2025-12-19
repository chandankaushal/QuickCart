const { ExpressError } = require("../utils/ExpressError");
const Product = require("../models/productModel");
async function checkProductStock(items, store_id) {
  let upcs = items.map((item) => item.upc);

  let result = await Product.getProductByUpc(upcs, store_id);

  let availableItems = result.rows;
  if (availableItems.length == 0) {
    throw new ExpressError(
      "None of the items you requested are available",
      400,
      "ITEM_NOT_FOUND"
    );
  }

  const dbMap = {};

  availableItems.forEach((item) => {
    dbMap[item.upc] = item;
  });

  const stockChecks = items.map((req) => {
    const prod = dbMap[req.upc];

    if (!prod) {
      return {
        upc: req.upc,
        status: "item_not_found",
      };
    }

    // console.log(`This is prod ${prod}`);

    if (prod.qty < req.qty) {
      return {
        upc: req.upc,
        status: "insufficient_stock",
        available: prod.qty,
        requested: req.qty,
      };
    }

    return {
      upc: req.upc,
      status: "ok",
      available: prod.qty,
      requested: req.qty,
    };
  });

  let OutOfStockItems = stockChecks.filter((el) => el.status !== "ok");
  if (OutOfStockItems.length > 0) {
    return { data: OutOfStockItems, problems: true };
  }
  return { data: stockChecks, problems: false };
}
// will implement this in create_order
async function updateQtyinDb(stockChecks) {
  if (stockChecks.status == "ok") {
    //Update DB
  } else {
    //Do Nothing
  }
}

module.exports = checkProductStock;
