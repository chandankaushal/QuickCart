const express = require("express");
const router = express.Router();
const {
  getUsers,
  registerUser,
  deleteUser,
  updateUser,
  loginUser,
} = require("../controllers/userController");

const { validateData } = require("../middleware/validate");
const { userSchema, storeSchema } = require("../models/joiSchema");
const { checkValidToken } = require("../middleware/auth");

router.get("/show", checkValidToken, getUsers);
router.post("/register", validateData(userSchema), registerUser);
router.put("/update", updateUser);
router.delete("/delete", deleteUser);
router.post("/login", loginUser);

module.exports = router;
