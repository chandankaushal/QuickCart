const express = require("express");
const router = express.Router();
const {
  getUsers,
  registerUser,
  deleteUser,
  updateUser,
  loginUser,
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

router.get("/show", checkValidToken, validateQuery(getUserSchema), getUsers);
router.post("/register", validateBody(userSchema), registerUser);
router.put("/update", updateUser);
router.delete("/delete", deleteUser);
router.post("/login", validateBody(loginSchema), loginUser);

module.exports = router;
