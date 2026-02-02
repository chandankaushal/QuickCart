const pool = require("../db");

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    console.log("ROLLING BACK");
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = withTransaction;
