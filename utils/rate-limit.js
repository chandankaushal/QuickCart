const { rateLimit } = require("express-rate-limit");
const { ExpressError, RateLimitError } = require("./ExpressError");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) => {
    return next(new RateLimitError());
  },
});

module.exports = limiter;
