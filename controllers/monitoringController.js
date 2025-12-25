const pool = require("../db");
async function checkDbHealth(req, res) {
  await pool.connect();
  req.log.info("Connected to DB!");
  let result = await pool.query("SELECT NOW()");
  res.status(200).json({ status: "success", message: result.rows[0].now });
}

module.exports = { checkDbHealth };
