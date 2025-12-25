const pool = require("../db");
const crypto = require("crypto");
const { validateEmail } = require("../utils/validEmail");
const { hashPassword, comparePassword } = require("../utils/hash");
const { userSchema } = require("../models/joiSchema");
const { getToken } = require("../utils/auth");
const {
  getUserByEmail,
  loginUser,
  registerUser,
} = require("../service/userService");
const { ExpressError } = require("../utils/ExpressError");
const { sendSuccess } = require("../utils/apiResponse");
const logger = require("../utils/logger");

let user_table = `"quickcart".users`;

async function getUsers(req, res) {
  let { email } = req.query;

  let response = await getUserByEmail(email, req.user.id);
  sendSuccess(res, null, response.rows, 200);
}

async function signupUser(req, res) {
  let { name, email, password } = req.body;
  let response = await registerUser(name, email, password);
  sendSuccess(res, null, response, 200);
}

async function deleteUser(req, res) {
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
}

async function updateUser(req, res) {
  res.send("Update User");
}

async function login(req, res) {
  let { email, password } = req.body;
  req.log.info({ email }, "Login attempt started");
  const response = await loginUser(email, password);
  req.log.info({ email }, "Login attempted finished");
  sendSuccess(res, null, response, 200);
}

module.exports = { getUsers, signupUser, deleteUser, updateUser, login };
