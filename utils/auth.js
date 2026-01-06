require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const jwt_token = require("../models/jwtTokenModel");

function getToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
}
function refreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }
  );
}

async function storeTokenInDB(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.id || !decoded.jti) {
    throw new Error("Invalid token: missing required fields");
  }
  const user_id = decoded.id;
  const token_id = decoded.jti;
  const issue_time = decoded.iat ? new Date(decoded.iat * 1000) : null;
  const expires_at = decoded.exp ? new Date(decoded.exp * 1000) : null;

  await jwt_token.addToDB(token_id, user_id, issue_time, expires_at);

  return true;
}
async function storeRefreshTokenInDB(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.id || !decoded.jti) {
    throw new Error("Invalid token: missing required fields");
  }
  const user_id = decoded.id;
  const token_id = decoded.jti;
  const issue_time = decoded.iat ? new Date(decoded.iat * 1000) : null;
  const expires_at = decoded.exp ? new Date(decoded.exp * 1000) : null;

  await jwt_token.addRefeshToDB(token_id, user_id, issue_time, expires_at);

  return true;
}

module.exports = {
  getToken,
  storeTokenInDB,
  refreshToken,
  storeRefreshTokenInDB,
};
