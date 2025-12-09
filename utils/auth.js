require("dotenv").config();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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

module.exports = { getToken };
