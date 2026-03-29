class ExpressError extends Error {
  constructor(message, statusCode = 500, code = "ERROR_NOT_HANDLED") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class UnauthorizedError extends ExpressError {
  constructor() {
    super("Invalid Token", 401, "Unauthorized");
  }
}
class ForbiddenError extends ExpressError {
  constructor() {
    super(
      "You do not have permission to access this resource",
      403,
      "FORBIDDEN",
    );
  }
}
class NotFoundError extends ExpressError {
  constructor() {
    super("The requested resource does not exist", 404, "NOT_FOUND");
  }
}
class InternalServerError extends ExpressError {
  constructor() {
    super("Internal Server Error", 500, "INTERNAL_SERVER_ERROR");
  }
}
class RateLimitError extends ExpressError {
  constructor() {
    super("Too Many Requests", 429, "RATE_LIMIT");
  }
}
module.exports = {
  ExpressError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
  RateLimitError,
};
