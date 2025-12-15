class ExpressError extends Error {
  constructor(message, statusCode = 500, code = "ERROR_NOT_HANDLED") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = {
  ExpressError,
};
