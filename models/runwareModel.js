const RUNWARE_TABLE_NAME = `quickcart.RUNWARE_DATA`;
const pool = require("../db");
const Runware = {
  async addTask(task_id, task_type) {
    const sql = `INSERT INTO ${RUNWARE_TABLE_NAME} (task_id,task_type) VALUES ($1,$2)`;

    const values = [task_id, task_type];

    return await pool.query(sql, values);
  },
  async addResult(task_id, image_url, image_id, seed, cost) {
    const sql = `UPDATE ${RUNWARE_TABLE_NAME} SET image_url = $2, image_id = $3, seed = $4, cost = $5 WHERE task_id = $1 AND image_url IS NULL`;
    const values = [task_id, image_url, image_id, seed, cost];
    return await pool.query(sql, values);
  },
};

module.exports = Runware;
