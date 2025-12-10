const express = require("express");
const router = express.Router();
const pickupServiceOptions = require("../controllers/serviceOptionsController");

router.post("/pickup", pickupServiceOptions);

module.exports = router;
