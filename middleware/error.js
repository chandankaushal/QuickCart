const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  const isExpressError = err instanceof ExpressError;

  const status = isExpressError ? err.statusCode : 500;
  const message = err.message ? err.message : "SERVER ERROR"; // Remains same for all errors
  const code = isExpressError ? err.code : "INTERNAL_ERROR";

  logger.error(
    {
      error: message,
      code: code,
      statusCode: status,
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      stack: err.stack,
    },
    "There was an error in the request"
  );

  res.status(status).json({ status: "error", message, code });
}

module.exports = errorHandler;
