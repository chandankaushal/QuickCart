const express = require("express");
const router = express.Router();
const {
  pickupServiceOptions,
  reserveServiceoption,
} = require("../controllers/serviceOptionsController");
const { checkValidToken } = require("../middleware/auth");

router.post("/pickup", checkValidToken, pickupServiceOptions);
router.post("/reserve", checkValidToken, reserveServiceoption);

module.exports = router;
