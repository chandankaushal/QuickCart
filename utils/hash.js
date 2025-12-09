const bcrypt = require("bcrypt");

async function hashPassword(myPlainTextPassword, saltRounds = 10) {
  return await bcrypt.hash(myPlainTextPassword, saltRounds);
}

module.exports = { hashPassword };
