const Product = require("../models/productModel");

async function calculateOrderTotal(items, store_id, client = null) {
  // get upcs
  let upcs = items.map((item) => item.upc);
  //Lookup Price
  let response = await Product.getPriceByUpc(upcs, store_id, client);

  let upcToPrice = {};
  response.rows.forEach((row) => {
    upcToPrice[row.upc] = parseInt(row.price_cents);
  });

  let orderTotal = 0;
  items.forEach((item) => {
    orderTotal = orderTotal + upcToPrice[item.upc] * item.qty;
  });
  return orderTotal;
}

module.exports = calculateOrderTotal;
