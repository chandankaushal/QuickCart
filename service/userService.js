const { validateEmail } = require("../utils/validEmail");
const User = require("../models/userModel");
const { ExpressError } = require("../utils/ExpressError");

async function getUserByEmail(email, user_id) {
  if (!user_id) {
    throw new ExpressError("No User ID", 400, "NO_USER_ID");
  }
  let isValid = validateEmail(email);

  if (isValid) {
    let response = await User.getByEmail(email);
    if (response.rowCount >= 1 && user_id == response.rows[0].id) {
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

module.exports = { getUserByEmail };
