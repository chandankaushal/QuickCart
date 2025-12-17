const pool = require("../db");
const crypto = require("crypto");
// const { validateEmail } = require("../utils/validEmail");
const { hashPassword, comparePassword } = require("../utils/hash");
const { userSchema } = require("../models/joiSchema");
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

  async registerUser(req, res) {
    console.log(req.body);
    try {
      let { name, email, password } = req.body;
      const uuid = crypto.randomUUID();
      let hashedPassword = await hashPassword(password);
      const sql = `INSERT INTO ${user_table} (id,name,email,password) VALUES ($1,$2,$3,$4)`;
      const values = [uuid, name, email, hashedPassword];
      await pool.query(sql, values);
      return res
        .status(200)
        .json({ status: "success", message: "User Inserted Successfully" });
    } catch (err) {
      console.log("There was an error with insert", err);
      res.status(500).json({
        status: "error",
        message: "Something went wrong",
      });
    }
  },

  async deleteUser(req, res) {
    try {
      let { email } = req.body;
      const sql = `DELETE FROM ${user_table} WHERE email = $1`;
      const values = [email];
      let response = await pool.query(sql, values);
      if (response.rowCount == 0) {
        return res.status(400).json({
          status: "error",
          message: "No users exist with the email address you provided",
        });
      }
      res
        .status(200)
        .json({ status: "success", message: "User deleted Successfully!" });
    } catch (err) {
      res.status(500).json({ status: "error", message: err.message });
    }
  },

  async updateUser(req, res) {
    res.send("Update User");
  },

  async loginUser(req, res) {
    let { email, password } = req.body;

    const sql = `SELECT id,name,email,role,password FROM ${user_table} WHERE email = $1`;
    let values = [email];

    const response = await pool.query(sql, values);

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
