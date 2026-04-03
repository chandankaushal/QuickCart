const {
  ServiceOptionHoldNotFoundError,
} = require("../errors/serviceOptionError");

async function isServiceOptionHoldOwner(holdUserId, userId) {
  if (holdUserId === userId) {
    return true;
  }
  throw new ServiceOptionHoldNotFoundError();
}

module.exports = isServiceOptionHoldOwner;
