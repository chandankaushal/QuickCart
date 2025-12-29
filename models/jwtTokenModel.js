const pool = require("../db");

const JWT_TOKENS_DB = `quickcart.JWT_TOKENS`;

const jwt_token = {
  async addToDB(token_id, user_id, issue_time, expires_at) {
    let sql = `INSERT INTO ${JWT_TOKENS_DB} (token_id,user_id,issue_time,expires_at) VALUES ($1,$2,$3,$4)`;
    let values = [token_id, user_id, issue_time, expires_at];
    let response = await pool.query(sql, values);
    return response;
  },
};

module.exports = jwt_token;
