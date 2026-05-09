const { ExpressError } = require("../utils/ExpressError");

class NoUserExistsError extends ExpressError {
  constructor() {
    super("User not Found", 400, "NO_USER_EXISTS");
  }
}
class UserNotActiveError extends ExpressError {
  constructor() {
    super(
      "Please activate the user using the link in your email",
      400,
      "USER_NOT_ACTIVATED",
    );
  }
}
class InvalidVerificationTokenError extends ExpressError {
  constructor() {
    super("The verification token is invalid.", 400, "INCORRECT_TOKEN");
  }
}
class InvalidEmailError extends ExpressError {
  constructor() {
    super("The provided email is not valid", 400, "INVALID_EMAIL");
  }
}

class CannotViewUserError extends ExpressError {
  constructor() {
    super("You do not have the permission to view this user", 400, "FORBIDDEN");
  }
}
class CannotUpdateUserError extends ExpressError {
  constructor() {
    super(
      "You do not have the permission to update this user",
      400,
      "FORBIDDEN",
    );
  }
}

module.exports = {
  NoUserExistsError,
  UserNotActiveError,
  InvalidVerificationTokenError,
  InvalidEmailError,
  CannotViewUserError,
  CannotUpdateUserError,
};
