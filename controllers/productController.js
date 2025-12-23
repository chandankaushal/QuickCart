const {
  checkProductStock,
  updateQtyinDb,
} = require("../service/productService");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { ExpressError } = require("../utils/ExpressError");
async function checkProductAvailabilty(req, res) {
  let { items, store_id } = req.body;

  let result = await checkProductStock(items, store_id);

  if (result.problems) {
    throw new ExpressError(
      "Some Products are not available",
      400,
      "NOT_AVAILABLE"
    );
  }
  sendSuccess(res, null, result.data, 200);
}

async function updateAvailabilty(req, res) {
  let { items, location_code } = req.body;
  let result = await updateQtyinDb(items, location_code);
  sendSuccess(res, "Updated Qty", result.rows, 200);
}

module.exports = { checkProductAvailabilty, updateAvailabilty };
