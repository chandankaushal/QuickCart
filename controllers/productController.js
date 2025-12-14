const checkProductStock = require("../service/productService");
const { sendSuccess } = require("../utils/apiResponse");

async function checkProductAvailabilty(req, res) {
  let { items, store_id } = req.body;

  let result = await checkProductStock(items, store_id);

  sendSuccess(res, null, result, 200);
}

module.exports = { checkProductAvailabilty };
