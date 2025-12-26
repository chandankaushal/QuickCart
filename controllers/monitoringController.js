const pool = require("../db");
async function checkDbHealth(req, res) {
  try {
    await pool.connect();
    console.log("Connected to DB!");
    let result = await pool.query("SELECT NOW()");
    res.status(200).json({ status: "success", message: result.rows[0].now });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ status: "error", message: "DB connection failed" });
  }
}

module.exports = { checkDbHealth };
