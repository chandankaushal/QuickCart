const express = require("express");
const router = express.Router();

const getStores = require("../controllers/storeController");

router.post("/get_stores", getStores);

module.exports = router;
