const express = require("express");
const router = express.Router();
const { checkDbHealth } = require("../controllers/monitoringController");
const wrapAsync = require("../utils/wrapAsync");

router.get("/db", wrapAsync(checkDbHealth));

module.exports = router;
