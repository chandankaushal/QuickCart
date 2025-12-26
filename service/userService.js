const { validateEmail } = require("../utils/validEmail");
const User = require("../models/userModel");
const { ExpressError } = require("../utils/ExpressError");
const { comparePassword, hashPassword } = require("../utils/hash");
const { getToken } = require("../utils/auth");
const crypto = require("crypto");
const logger = require("../utils/logger");

async function getUserByEmail(email, user_id, log = logger) {
  if (!user_id) {
    throw new ExpressError("No User ID", 400, "NO_USER_ID");
  }
  log.info("Validating Email");
  let isValid = validateEmail(email);

  if (isValid) {
    let response = await User.getByEmail(email);
    if (response.rowCount >= 1 && user_id == response.rows[0].id) {
      log.info(response.rows[0].email, `Found User`);
      return response;
    } else {
      throw new ExpressError(
        "The requested user does not exist or you do not have the permission to access them",
        400,
        "NO_USER_FOUND"
      );
    }
  }
}

async function loginUser(email, password, log = logger) {
  log.info("Getting User by Email");
  const response = await User.getPasswordByEmail(email);
  console.log(response);
  log.info("Comparing Passwords");
  let result = await comparePassword(password, response.rows[0].password);
  if (result) {
    let userObj = {
      id: response.rows[0].id,
      email: response.rows[0].email,
      role: response.rows[0].role,
    };
    let access_token = getToken(userObj);
    log.info("Generated Access Token");
    return { access_token: access_token };
  } else {
    throw new ExpressError(
      "Please check your credentials",
      401,
      "UNAUTHORIZED"
    );
  }
}

async function registerUser(name, email, password, log = logger) {
  try {
    const uuid = crypto.randomUUID();
    let hashedPassword = await hashPassword(password);
    let response = await User.register(uuid, name, email, hashedPassword);
    return response;
  } catch (err) {
    // Unique constraint
    if (err.code === "23505") {
      throw new ExpressError("Record already exists", 409, "UNIQUE_VIOLATION");
    }

    // Foreign key violation
    if (err.code === "23503") {
      throw new ExpressError("Invalid reference", 400, "FOREIGN_KEY_VIOLATION");
    }

    // Invalid input (UUID, int, etc.)
    if (err.code === "22P02") {
      throw new ExpressError("Invalid input format", 400, "INVALID_INPUT");
    }

    // Fallback
    throw new ExpressError("Database operation failed", 500, "DATABASE_ERROR");
  }
}

module.exports = { getUserByEmail, loginUser, registerUser };
