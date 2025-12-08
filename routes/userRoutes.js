const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  deleteUser,
  updateUser,
} = require("../controllers/userController");

router.get("/show", getUsers);
router.post("/create", createUser);
router.put("/update", updateUser);
router.delete("/delete", deleteUser);

module.exports = router;
