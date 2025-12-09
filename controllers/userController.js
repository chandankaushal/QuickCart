const pool = require("../db");
const crypto = require("crypto");
const { validateEmail } = require("../utils/validEmail");
const { hashPassword } = require("../utils/hash");
const { userSchema } = require("../models/joiSchema");

let user_table = `"quickcart".users`;

async function getUsers(req, res) {
  try {
    let { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email cannot be empty" });
    }
    let isValid = validateEmail(email);
    if (isValid) {
      let sql = `SELECT * FROM ${user_table} WHERE email = $1`;
      let values = [email];
      let response = await pool.query(sql, values);
      // console.log(response);
      if (response.rowCount >= 1) {
        return res.status(200).json({
          status: "success",
          message: { name: response.rows[0].name, id: response.rows[0].id },
        });
      } else {
        return res
          .status(200)
          .json({ status: "success", message: "No results" });
      }
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Your email is in invalid format" });
    }
  } catch (err) {
    console.error("DB Test Error:", err);
  }
}

async function registerUser(req, res) {
  console.log(req.body);
  try {
    validateUserData(req.body, res);
    console.log("After");
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

function validateUserData(value, res) {
  const { error } = userSchema.validate(value);
  if (error) {
    return { status: 400, message: error.details[0].message };
  }
}

module.exports = { getUsers, registerUser, deleteUser, updateUser };
