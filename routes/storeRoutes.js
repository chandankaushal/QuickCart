const express = require("express");
const router = express.Router();

const getStores = require("../controllers/storeController");

router.post("/show", getStores);

module.exports = router;
