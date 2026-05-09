const User = require("../models/userModel");
const { ExpressError, InternalServerError } = require("./ExpressError");
const logger = require("./logger");

async function isSameUser(currentUser, newUser, log = logger) {
  if (currentUser === newUser) {
    return true;
  } else {
    return false;
  }
}

module.exports = isSameUser;
