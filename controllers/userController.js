const pool = require("../db");
const crypto = require("crypto");
const uuid = crypto.randomUUID();

let user_table = `"Users".users`;

async function getUsers(req, res) {
  try {
    let { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Please provide a valid email" });
    }
    // Add Joi Validation here
    let sql = `SELECT * FROM ${user_table} WHERE email = $1`;
    let values = [email];
    let response = await pool.query(sql, values);
    console.log(response);
    res.send("Hello");
  } catch (err) {
    console.error("DB Test Error:", err);
  }
}

async function createUser(req, res) {
  console.log(req.body);
  let { name, email } = req.body;
  if (!name || !email) {
    return res
      .status(400)
      .json({ status: "error", message: "Please provide both name and email" });
  } else {
    try {
      const sql = `INSERT INTO ${user_table} (id,name,email) VALUES ($1,$2,$3)`;
      const values = [uuid, name, email];
      let response = await pool.query(sql, values);
      // console.log(`User Added`, response);
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

module.exports = { getUsers, createUser, deleteUser, updateUser };
