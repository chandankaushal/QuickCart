const express = require("express");
const router = express.Router();

const getStores = require("../controllers/storeController");
const { checkValidToken } = require("../middleware/auth");

router.post("/get_stores", checkValidToken, getStores);

module.exports = router;
