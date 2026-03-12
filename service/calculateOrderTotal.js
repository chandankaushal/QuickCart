const Product = require("../models/productModel");

async function calculateOrderTotal(items, store_id, client = null) {
  // get upcs
  let upcs = items.map((item) => item.upc);
  //Lookup Price
  let response = await Product.getPriceByUpc(upcs, store_id, (client = null));

  let upcToPrice = {};
  response.rows.forEach((row) => {
    upcToPrice[row.upc] = parseInt(row.price_cents);
  });
  console.log(upcToPrice);

  let orderTotal = 0;
  items.forEach((item) => {
    orderTotal = orderTotal + upcToPrice[item.upc] * item.qty;
  });
  console.log(orderTotal);
  return orderTotal;
}

module.exports = calculateOrderTotal;
