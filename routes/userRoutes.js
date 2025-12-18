const express = require("express");
const router = express.Router();
const {
  getUsers,
  signupUser,
  deleteUser,
  updateUser,
  login,
} = require("../controllers/userController");

const {
  validateData,
  validateBody,
  validateQuery,
} = require("../middleware/validate");
const {
  userSchema,
  getUserSchema,
  storeSchema,
  loginSchema,
} = require("../models/joiSchema");
const { checkValidToken } = require("../middleware/auth");
const wrapAsync = require("../utils/wrapAsync");

router.get(
  "/show",
  checkValidToken,
  validateQuery(getUserSchema),
  wrapAsync(getUsers)
);
router.post("/register", validateBody(userSchema), wrapAsync(signupUser));
router.put("/update", wrapAsync(updateUser));
router.delete("/delete", wrapAsync(deleteUser));
router.post("/login", validateBody(loginSchema), wrapAsync(login));

module.exports = router;
