const jwt = require("jsonwebtoken");
const { ExpressError, UnauthorizedError } = require("../utils/ExpressError");
const jwt_token = require("../models/jwtTokenModel");
const isOrderOwner = require("../utils/orderOwner");

function checkValidToken(req, res, next) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ExpressError(
      "Auth Token missing or Invalid",
      401,
      "MISSING_OR_NO_TOKEN",
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
      "Unauthorized",
    );
  }
}
async function checkValidRefreshToken(req, res, next) {
  req.log.info("Checking valid Refresh token");
  let { refresh_token } = req.cookies;
  if (!refresh_token) {
    throw new ExpressError(
      "Refresh Token Missing or invalid",
      401,
      "MISSING_OR_NO_TOKEN",
    );
  }

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const resultDB = await jwt_token.getRefreshTokenFromDB(decoded.jti);
    if (resultDB.rowCount === 0) {
      //TO-DO If this happens invalidate all refresh tokens for that user.
      req.log.warn(
        { user_id: decoded.id },
        "Possible Token Theft, Revoking all refresh tokens for this user",
      );
      const deletedTokens = await jwt_token.deleteRefreshTokenForUser(
        decoded.id,
      );
      req.log.info({ count: deletedTokens.rowCount }, "Revoked refresh tokens");
      res.clearCookie("refresh_token"); //Clearing cookie
      throw new Error("Token is blocked"); // This will be caught by catch block
    }
    req.user = decoded;
    req.log = req.log.child({ user_id: req.user.id }); //Adding user id to log every-time this function is called.
    req.log.info("The refresh Token is still valid");
    next();
  } catch (err) {
    throw new ExpressError(
      "Auth Token Expired or Invalid",
      401,
      "Unauthorized",
    );
  }
}
async function checkOwner(req, res, next) {
  if (!req.headers.authorization) {
    throw new ExpressError("No Token", 401, "UNAUTHORIZED");
  }
  const token = req.headers.authorization.split(" ")[1];
  //Decode Token
  const decoded = jwt.decode(token);
  const user_id = decoded.id;

  const { order_id } = req.body;

  //Check if user is owner of that order
  await isOrderOwner(order_id, user_id, req.log);
  // if yes then proceed;
  next();
}

module.exports = { checkValidToken, checkValidRefreshToken, checkOwner };
