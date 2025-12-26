const { ExpressError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

function errorHandler(err, req, res, next) {
  // Handle PostgreSQL database errors
  if (err.code === "23505") {
    err = new ExpressError("Record already exists", 409, "UNIQUE_VIOLATION");
  } else if (err.code === "23503") {
    err = new ExpressError("Invalid reference", 400, "FOREIGN_KEY_VIOLATION");
  } else if (err.code === "22P02") {
    err = new ExpressError("Invalid input format", 400, "INVALID_INPUT");
  }

  const isExpressError = err instanceof ExpressError;

  const status = isExpressError ? err.statusCode : 500;
  const message = err.message ? err.message : "SERVER ERROR"; // Remains same for all errors
  const code = isExpressError ? err.code : "INTERNAL_ERROR";

  logger.error(
    {
      req: {
        method: req.method,
        path: req.path,
        id: req.id,
      },
      error: message,
      code: code,
      statusCode: status,
      stack: err.stack,
    },
    message
  );

  res.status(status).json({ status: "error", message, code });
}

module.exports = errorHandler;
