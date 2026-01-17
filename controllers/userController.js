const pool = require("../db");
const {
  getUserByEmail,
  loginUser,
  registerUser,
  new_access_token_from_refresh_token,
} = require("../service/userService");

const { sendSuccess, setRefreshTokenCookie } = require("../utils/apiResponse");
const logger = require("../utils/logger");

let user_table = `"quickcart".users`;

async function getUsers(req, res) {
  let { email } = req.query;
  req.log.info({ email }, "Looking up this user in DB");
  let response = await getUserByEmail(email, req.user.id, req.log);
  req.log.info({ email }, "User Found");
  sendSuccess(res, null, response.rows, 200);
}

async function signupUser(req, res) {
  let { name, email, password } = req.body;
  let response = await registerUser(name, email, password, req.log);
  //Generate a Sign-UP Token with ID
  // Put it in a DB
  // It will then be verified when user clicks on the link.
  sendSuccess(
    res,
    "User Registered Successfully. Please verify your email.",
    { token_id: response },
    200,
  );
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
  const response = await loginUser(email, password, req.log);
  req.log.info({ email }, "User Logged in Successfully");
  setRefreshTokenCookie(res, response.refresh_token);
  sendSuccess(res, null, response.access_token, 200);
}

async function refreshToken(req, res) {
  let { jti } = req.user;
  let userObj = {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  };
  let new_access_token = await new_access_token_from_refresh_token(
    jti,
    userObj,
    req.log,
  );
  //Adding new refresh token to the cookie
  setRefreshTokenCookie(res, new_access_token.refresh_token);
  sendSuccess(res, null, new_access_token.access_token, 200);
}
async function emailVerify(req, res) {
  let { token_id } = req.params;
  // if token exists and is valid then we set the verify flag in users table to true.
}

module.exports = {
  getUsers,
  signupUser,
  deleteUser,
  updateUser,
  login,
  refreshToken,
  emailVerify,
};
