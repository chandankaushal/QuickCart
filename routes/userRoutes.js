const express = require("express");
const router = express.Router();
const {
  getUsers,
  registerUser,
  deleteUser,
  updateUser,
} = require("../controllers/userController");

const { validateUserData } = require("../middleware/validate");
const { userSchema } = require("../models/joiSchema");

router.get("/show", getUsers);
router.post("/register", validateUserData(userSchema), registerUser);
router.put("/update", updateUser);
router.delete("/delete", deleteUser);

module.exports = router;
