const { ExpressError } = require("../utils/ExpressError");
const Product = require("../models/productModel");
const logger = require("../utils/logger");
async function checkProductStock(items, store_id, log = logger) {
  log.info(
    { items: { requested_items: items.length } },
    `Looking up for Requested Items`
  );
  let upcs = items.map((item) => item.upc);

  let { rows: availableItems } = await Product.getProductByUpc(upcs, store_id);

  if (availableItems.length === 0) {
    throw new ExpressError(
      "None of the items you requested are available",
      400,
      "ITEM_NOT_FOUND"
    );
  }
  log.info(
    {
      items: {
        found_items: availableItems.length,
      },
    },
    `Found Items`
  );
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
    log.info({ OutOfStockItems }, `Out of Stock items`);
    return { data: OutOfStockItems, problems: true };
  }
  return { data: stockChecks, problems: false };
}

async function updateQtyinDb(items, store_id, client = null) {
  let { rowCount: products_updated } = await Product.batchUpdateProductQty(
    items,
    store_id
  );
  if (products_updated === 0) {
    throw new ExpressError("Nothing was updated in the DB", 400, "NO_UPDATE");
  }
  return products_updated;
}

module.exports = { checkProductStock, updateQtyinDb };
