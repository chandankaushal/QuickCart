// controllers/storeController.js
// const pool = require("../db");

// const storesTable = `"quickcart".stores`;
const { Stores } = require("../models/storeModel");
const { sendError, sendSuccess } = require("../utils/apiResponse");

async function getStores(req, res) {
  try {
    let { zip_code, street } = req.body;

    if (!zip_code) {
      return sendError(res, "Zip code cannot be empty", 400);
    }

    let response = await Stores.getStoresByZip(zip_code, street);
    if (response.rowCount <= 0) {
      return sendError(
        res,
        "No Stores Found for this Zip code. Please try another one.",
        400
      );
    }

    return sendSuccess(res, null, response.rows, 200);
  } catch (err) {
    console.error("Error in getStores:", err);
    return sendError(res, "Internal server error", 500);
  }
}

module.exports = getStores;
