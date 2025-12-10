const express = require("express");
const router = express.Router();
const {
  pickupServiceOptions,
  reserveServiceoption,
} = require("../controllers/serviceOptionsController");

router.post("/pickup", pickupServiceOptions);
router.post("/reserve", reserveServiceoption);

module.exports = router;
