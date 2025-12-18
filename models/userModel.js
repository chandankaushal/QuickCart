const pool = require("../db");
const crypto = require("crypto");
// const { validateEmail } = require("../utils/validEmail");
const { hashPassword, comparePassword } = require("../utils/hash");
const { getToken } = require("../utils/auth");
const { ExpressError } = require("../utils/ExpressError");

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
    // if (response.rowCount == 0) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "No users exist with the email address you provided",
    //   });
    // }
    return response;
  },

  async updateUser(req, res) {
    res.send("Update User");
  },

  async loginUser(email, password) {
    // This can be done by GetEmail, we can just have a service that can verify the password
    const sql = `SELECT id,name,email,role,password FROM ${user_table} WHERE email = $1`;
    let values = [email];

    const response = await pool.query(sql, values);
    return response;

    let result = await comparePassword(password, response.rows[0].password);
    if (result) {
      const User = {
        id: response.rows[0].id,
        email: response.rows[0].email,
        role: response.rows[0].role,
      };

      return res.status(200).json({
        status: "success",
        message: "logged in",
        access_token: getToken(User),
      });
    } else {
      return res
        .status(401)
        .json({ status: "error", message: "please check your credentials" });
    }
  },
};

module.exports = User;
