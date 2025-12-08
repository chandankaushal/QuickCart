const express = require("express");
const router = express.Router();
const { checkDbHealth } = require("../controllers/monitoringController");

router.get("/db", checkDbHealth);

module.exports = router;
