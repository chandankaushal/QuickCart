const pool = require("../db");

const JWT_TOKENS_DB = `quickcart.JWT_TOKENS`;
const REFERESH_TOKENS_DB = `quickcart.REFRESH_TOKENS`;
const SIGNUP_TOKENS_DB = `quickcart.SIGNUP_TOKENS`;

const jwt_token = {
  async addToDB(token_id, user_id, issue_time, expires_at) {
    const sql = `INSERT INTO ${JWT_TOKENS_DB} (token_id,user_id,issue_time,expires_at) VALUES ($1,$2,$3,$4)`;
    const values = [token_id, user_id, issue_time, expires_at];
    const response = await pool.query(sql, values);
    return response;
  },
  async addRefeshToDB(token_id, user_id, issue_time, expires_at) {
    const sql = `INSERT INTO ${REFERESH_TOKENS_DB} (token_id,user_id,issue_time,expires_in) VALUES ($1,$2,$3,$4)`;
    const values = [token_id, user_id, issue_time, expires_at];
    const response = await pool.query(sql, values);
    return response;
  },
  async deleteRefreshTokenFromDb(id) {
    const sql = `DELETE FROM ${REFERESH_TOKENS_DB} WHERE id =$1`;
    const values = [id];
    const response = await pool.query(sql, values);
    return response;
  },
  async getRefreshTokenFromDB(id) {
    let sql = `SELECT * FROM ${REFERESH_TOKENS_DB} WHERE id = $1`;
    let values = [id];
    let response = await pool.query(sql, values);
    return response;
  },
  async deleteRefreshTokenForUser(user_id) {
    const sql = `DELETE FROM ${REFERESH_TOKENS_DB} WHERE user_id =$1`;
    const values = [user_id];
    const response = await pool.query(sql, values);
    return response;
  },
  async addSignupToDB(
    token_id,
    user_id,
    issue_time,
    expires_at,
    client = null,
  ) {
    const sql = `INSERT INTO ${SIGNUP_TOKENS_DB} (token_id,user_id,issue_time,expires_in) VALUES ($1,$2,$3,$4)`;
    const values = [token_id, user_id, issue_time, expires_at];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
  async deleteSignupTokenFromDb(id, client = null) {
    const sql = `DELETE FROM ${SIGNUP_TOKENS_DB} WHERE token_id =$1`;
    const values = [id];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
  async getSignupTokenFromDB(id) {
    let sql = `SELECT * FROM ${SIGNUP_TOKENS_DB} WHERE token_id = $1`;
    let values = [id];
    let response = await pool.query(sql, values);
    return response;
  },
};

module.exports = jwt_token;
