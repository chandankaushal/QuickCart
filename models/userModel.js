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

  async register(uuid, name, email, hashedPassword) {
    const sql = `INSERT INTO ${user_table} (id,name,email,password) VALUES ($1,$2,$3,$4)`;
    const values = [uuid, name, email, hashedPassword];
    let response = await pool.query(sql, values);
    return response;
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
};

module.exports = User;
