const { InternalServerError } = require("../utils/ExpressError");
const Product = require("../models/productModel");
const logger = require("../utils/logger");
const {
  AllItemsNotFoundError,
  ItemNotFoundError,
} = require("../errors/itemErrors");
async function checkProductStock(items, store_id, log = logger) {
  log.info({ items, store_id }, "checking product availabilty");
  let upcs = items.map((item) => item.upc);
  let { rows: availableItems } = await Product.getProductByUpc(upcs, store_id);

  if (availableItems.length === 0) {
    throw new AllItemsNotFoundError();
  }
  log.info(
    {
      items: {
        found_items: availableItems.length,
      },
    },
    `Found Items`,
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

  let outOfStockItems = stockChecks.filter((el) => el.status !== "ok");
  if (outOfStockItems.length > 0) {
    log.info({ outOfStockItems }, `Out of Stock items`);
    throw new ItemNotFoundError(
      `UPC ${outOfStockItems.map((el) => el.upc).join(",")} is not available`,
    );
  }
  return { data: stockChecks, problems: false };
}

async function updateQtyinDb(items, store_id, client = null, log = logger) {
  log.info({ items }, "Adjusting Stock");
  let { rowCount: products_updated } = await Product.batchUpdateProductQty(
    items,
    store_id,
    client,
  );
  if (products_updated === 0) {
    throw new InternalServerError();
  }
  return products_updated;
}

module.exports = { checkProductStock, updateQtyinDb };
