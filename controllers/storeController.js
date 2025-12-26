const { getStoresService } = require("../service/storeService");
const { sendSuccess } = require("../utils/apiResponse");

async function getStores(req, res) {
  let { zip_code, street } = req.body;

  let response = await getStoresService(zip_code, street, req.log);

  return sendSuccess(res, null, response.rows, 200);
}

module.exports = getStores;
