// controllers/storeController.js
const pool = require("../db");

const storesTable = `"quickcart".stores`;

async function getStores(req, res) {
  try {
    let { zip_code, street } = req.body;

    if (!zip_code) {
      return res
        .status(400)
        .json({ status: "error", message: "Zip code cannot be empty" });
    }

    let sql = `SELECT store_id,name,zip_code FROM ${storesTable} WHERE zip_code = $1`;
    const params = [zip_code];

    if (street) {
      sql += " AND street ILIKE $2";
      params.push(`%${street}%`);
    }

    const result = await pool.query(sql, params);

    if (result.rowCount <= 0) {
      return res.status(400).json({
        status: "error",
        data: "No Stores found for this zip code. Please try another zip code",
      });
    }

    return res.status(200).json({
      status: "success",
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error("Error in getStores:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
}

module.exports = getStores;
