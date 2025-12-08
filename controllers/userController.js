const pool = require("../db");
const crypto = require("crypto");
const uuid = crypto.randomUUID();

let user_table = `"Users".users`;

async function getUsers(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM ${user_table}`);

    let formattedList = result.rows.map((user) => `name:${user.name}`);
    res.json(formattedList);

    client.release(); // Releasing connection to the pool
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
        message: "Something went wrong, Please try again later",
      });
    }
  }
}

async function deleteUser(req, res) {
  const sql = `DELETE FROM ${user_table} WHERE `;
  res.send("Delete User");
}

async function updateUser(req, res) {
  res.send("Update User");
}

module.exports = { getUsers, createUser, deleteUser, updateUser };
