function isAdmin(role) {
  if (role === "admin") {
    return true;
  }
  return false;
}

module.exports = isAdmin;
