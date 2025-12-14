const checkProductStock = require("../service/productService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

async function checkProductAvailabilty(req, res) {
  let { items, store_id } = req.body;

  let result = await checkProductStock(items, store_id);

  if (result.problems) {
    sendError(res, result.data, 400);
  }
  sendSuccess(res, null, result.data, 200);
}

module.exports = { checkProductAvailabilty };
