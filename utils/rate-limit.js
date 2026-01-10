const { rateLimit } = require("express-rate-limit");
const { ExpressError } = require("./ExpressError");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 1,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      status: "error",
      message: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
    });
  },
});

module.exports = limiter;
