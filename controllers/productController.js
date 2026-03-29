const { ItemNotFoundError } = require("../errors/itemErrors");
const { checkProductStock } = require("../service/productService");
const { sendSuccess } = require("../utils/apiResponse");

async function checkProductAvailabilty(req, res) {
  let { items, location_code } = req.body;

  let result = await checkProductStock(items, location_code, req.log);

  if (result.problems) {
    throw new ItemNotFoundError();
  }
  sendSuccess(res, null, result.data, 200);
}

module.exports = { checkProductAvailabilty };
