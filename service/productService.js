const Product = require("../models/productModel");
const { GetupcFromItems } = require("../utils/items");
async function checkProductStock(items, store_id) {
  // console.log(items);
  let upcs = items.map((item) => item.upc);

  let result = await Product.getProductByUpc(upcs, store_id);
  let availableItems = result.rows;

  const dbMap = {};

  availableItems.forEach((item) => {
    dbMap[item.upc] = item;
  });
  console.log(dbMap);

  const stockChecks = items.map((req) => {
    const prod = dbMap[req.upc];
    console.log(`This is prod ${prod}`);

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

  return stockChecks;
}

async function updateQtyinDb(stockChecks) {
  if (stockChecks.status == "ok") {
    //Update DB
  } else {
    //Do Nothing
  }
}

module.exports = checkProductStock;
