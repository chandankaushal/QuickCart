const jwt = require("jsonwebtoken");
const { ExpressError, UnauthorizedError } = require("../utils/ExpressError");

function checkValidToken(req, res, next) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ExpressError(
      "Auth Token missing or Invalid",
      401,
      "MISSING_OR_NO_TOKEN"
    );
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.log = req.log.child({ user_id: req.user.id }); //Adding user id to log every-time this function is called.

    next();
  } catch (err) {
    throw new ExpressError(
      "Auth Token Expired or Invalid",
      401,
      "Unauthorized"
    );
  }
}

module.exports = { checkValidToken };
