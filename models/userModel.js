const pool = require("../db");

let user_table = `"quickcart".users`;

const User = {
  async getByEmail(email) {
    let sql = `SELECT id,name,email,role FROM ${user_table} WHERE email = $1`;
    let values = [email];
    let response = await pool.query(sql, values);
    return response;
  },
  async getPasswordByEmail(email) {
    let sql = `SELECT id,name,email,role,password FROM ${user_table} WHERE email = $1`;
    let values = [email];
    let response = await pool.query(sql, values);
    return response;
  },
  async isUserActive(email) {
    let sql = `SELECT verified FROM ${user_table} WHERE email = $1`;
    let values = [email];
    let response = await pool.query(sql, values);
    return response;
  },
  async register(uuid, name, email, hashedPassword, client = null) {
    const sql = `INSERT INTO ${user_table} (id,name,email,password) VALUES ($1,$2,$3,$4)`;
    const values = [uuid, name, email, hashedPassword];
    const runner = client || pool;
    return await runner.query(sql, values);
  },

  async deleteUser(email) {
    const sql = `DELETE FROM ${user_table} WHERE email = $1`;
    const values = [email];
    let response = await pool.query(sql, values);
    return response;
  },

  async updateUser(currentUserId, newData, client = null) {
    const preStatement = `UPDATE ${user_table}`;
    let statement = "";
    const setClause = Object.keys(newData)
      .map((el, index) => `${el} = $${index + 1}`)
      .join(", ");
    const returnParams = Object.keys(newData).join(",");
    const finalStatement = `${preStatement} SET ${setClause} WHERE id = $${Object.keys(newData).length + 1} RETURNING id, email`;
    let params = Object.keys(newData).map((el) => newData[el]);
    params.push(currentUserId);
    // EXECUTE
    const runner = client || pool;
    return await runner.query(finalStatement, params);
    //MAKE SURE IT IS UPDATED
    // res.send("Update User");
  },

  async loginUser(email, password) {
    const sql = `SELECT id,name,email,role,password FROM ${user_table} WHERE email = $1`;
    let values = [email];
    const response = await pool.query(sql, values);
    return response;
  },
  async verifyUser(id, client = null) {
    let sql = `UPDATE ${user_table} SET verified = true WHERE id = $1 AND verified = false`;
    let values = [id];
    const runner = client || pool;
    return await runner.query(sql, values);
  },
  async getById(id, client = null) {
    const sql = `SELECT * FROM ${user_table} WHERE id = $1`;
    const values = [id];
    let runner = client || pool;
    return await runner.query(sql, values);
  },
};

module.exports = User;
