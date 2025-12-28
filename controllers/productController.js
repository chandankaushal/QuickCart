const { checkProductStock } = require("../service/productService");
const { sendSuccess } = require("../utils/apiResponse");
const { ExpressError } = require("../utils/ExpressError");
async function checkProductAvailabilty(req, res) {
  let { items, location_code } = req.body;

  let result = await checkProductStock(items, location_code, req.log);

  if (result.problems) {
    throw new ExpressError(
      "Some Products are not available",
      400,
      "NOT_AVAILABLE"
    );
  }
  sendSuccess(res, null, result.data, 200);
}

module.exports = { checkProductAvailabilty };
