const { ItemNotFoundError } = require("../errors/itemErrors");
const {
  checkProductStock,
  getAvailableProductsByStore,
} = require("../service/productService");
const { sendSuccess } = require("../utils/apiResponse");

async function checkProductAvailabilty(req, res) {
  let { items, location_code } = req.body;

  let result = await checkProductStock(items, location_code, req.log);

  if (result.problems) {
    throw new ItemNotFoundError();
  }
  sendSuccess(res, null, result.data, 200);
}

async function getAvailableProducts(req, res) {
  const { store_id } = req.body;
  const products = await getAvailableProductsByStore(store_id, req.log);
  sendSuccess(res, null, products, 200);
}

module.exports = { checkProductAvailabilty, getAvailableProducts };
