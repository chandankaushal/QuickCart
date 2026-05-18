const jwt = require("jsonwebtoken");
const {
  ExpressError,
  UnauthorizedError,
  InternalServerError,
} = require("../utils/ExpressError");
const jwt_token = require("../models/jwtTokenModel");
const isOrderOwner = require("../utils/orderOwner");
const isAdmin = require("../utils/isadmin");

function checkValidToken(req, res, next) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.log = req.log.child({ user_id: req.user.id }); //Adding user id to log every-time this function is called.

    next();
  } catch (err) {
    throw new UnauthorizedError();
  }
}
async function checkValidRefreshToken(req, res, next) {
  req.log.info("Checking valid Refresh token");
  let { refresh_token } = req.cookies;
  if (!refresh_token) {
    throw new UnauthorizedError();
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
      throw new UnauthorizedError(); // This will be caught by catch block
    }
    req.user = decoded;
    req.log = req.log.child({ user_id: req.user.id }); //Adding user id to log every-time this function is called.
    req.log.info("The refresh Token is still valid");
    next();
  } catch (err) {
    throw new UnauthorizedError();
  }
}

async function checkOrderOwner(req, res, next) {
  // check Valid token sets the current user to req.user already
  if (!req.user) {
    throw new UnauthorizedError();
  }
  if (isAdmin(req.user.role)) {
    return next();
  }
  //Check if user is owner of that order
  await isOrderOwner(req.body.order_id, req.user.id, req.log);
  // if yes then proceed;
  return next();
}

function checkMcpAuthToken(req, res, next) {
  let authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authHeader.split(" ")[1];
  try {
    if (token === process.env.MCP_AUTH_TOKEN) {
      next();
    } else {
      throw new UnauthorizedError();
    }
  } catch (err) {
    req.log.error({ err });
    throw new InternalServerError();
  }
}

module.exports = {
  checkValidToken,
  checkValidRefreshToken,
  checkOrderOwner,
  checkMcpAuthToken,
};
