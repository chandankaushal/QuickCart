const bcrypt = require("bcrypt");

async function hashPassword(myPlainTextPassword, saltRounds = 10) {
  return await bcrypt.hash(myPlainTextPassword, saltRounds);
}

async function comparePassword(myPlainTextPassword, hashPassword) {
  return await bcrypt.compare(myPlainTextPassword, hashPassword);
}

module.exports = { hashPassword, comparePassword };
