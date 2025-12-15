const { ExpressError } = require("../utils/ExpressError");

function errorHandler(err, req, res, next) {
  const isExpressError = err instanceof ExpressError;

  const status = isExpressError ? err.statusCode : 500;
  const message = isExpressError ? err.message : "Server error";
  const code = isExpressError ? err.code : "INTERNAL_ERROR";

  res.status(status).json({ status: "error", message, code });
}

module.exports = errorHandler;
