const express = require("express");
const router = express.Router();
const {
  pickupServiceOptions,
  reserveServiceoption,
} = require("../controllers/serviceOptionsController");
const { checkValidToken } = require("../middleware/auth");
const {
  getServiceOptionSchema,
  reserveServiceOptionSchema,
} = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/pickup",
  validateBody(getServiceOptionSchema),
  checkValidToken,
  pickupServiceOptions
);
router.post(
  "/reserve",
  validateBody(reserveServiceOptionSchema),
  checkValidToken,
  reserveServiceoption
);

module.exports = router;
