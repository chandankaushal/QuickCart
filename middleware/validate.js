const { ExpressError } = require("../utils/ExpressError");

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new ExpressError(
          error.details.map((d) => d.message.replace(/"/g, "")).join(", "), // Stripping \ in joi error
          400,
          "VALIDATION_ERROR"
        )
      );
    }

    req.body = value; // sanitized input
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new ExpressError(
          error.details.map((d) => d.message.replace(/"/g, "")).join(", "),
          400,
          "INVALID_QUERY"
        )
      );
    }

    req.query = value;
    next();
  };
}

module.exports = { validateBody, validateQuery };
