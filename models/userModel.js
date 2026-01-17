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
    if (client) {
      // console.log("using client");
      let response = await client.query(sql, values);
      return response;
    } else {
      let response = await pool.query(sql, values);
      return response;
    }
  },

  async deleteUser(email) {
    const sql = `DELETE FROM ${user_table} WHERE email = $1`;
    const values = [email];
    let response = await pool.query(sql, values);
    return response;
  },

  async updateUser(req, res) {
    res.send("Update User");
  },

  async loginUser(email, password) {
    const sql = `SELECT id,name,email,role,password FROM ${user_table} WHERE email = $1`;
    let values = [email];
    const response = await pool.query(sql, values);
    return response;
  },
  async verifyUser(id, client = null) {
    if (client) {
      let sql = `UPDATE ${user_table} SET verified = true WHERE id = $1 AND verified = false`;
      let values = [id];
      let response = await client.query(sql, values);
      return response;
    } else {
      let sql = `UPDATE ${user_table} SET verified = true WHERE id = $1 AND verified = false`;
      let values = [id];
      let response = await pool.query(sql, values);
      return response;
    }
  },
};

module.exports = User;
