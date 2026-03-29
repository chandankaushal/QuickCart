require("dotenv").config();

const pool = require("../db");
const { InternalServerError } = require("../utils/ExpressError");
const logger = require("../utils/logger");
async function checkDbHealth(req, res) {
  try {
    await pool.connect();

    let result = await pool.query("SELECT NOW()");
    logger.info("Connected to DB");
    res.status(200).json({ status: "success", message: result.rows[0].now });
  } catch (err) {
    logger.warn({ err: err }, "Issues connecting to DB");
    throw new InternalServerError();
  }
}

module.exports = { checkDbHealth };
