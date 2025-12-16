const { validateEmail } = require("../utils/validEmail");
const User = require("../models/userModel");
const { ExpressError } = require("../utils/ExpressError");

async function getUserService(email) {
  let isValid = validateEmail(email);
  if (isValid) {
    let response = User.getUsers(email);
    if (response.rowCount >= 1 && req.user.id == response.rows[0].id) {
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

module.exports = { getUserService };
