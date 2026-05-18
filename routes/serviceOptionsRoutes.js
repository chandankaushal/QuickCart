const express = require("express");
const router = express.Router();
const {
  pickupServiceOptions,
  reserveServiceoption,
  holdPickupWindow,
} = require("../controllers/serviceOptionsController");
const { checkValidToken } = require("../middleware/auth");
const {
  getServiceOptionSchema,
  reserveServiceOptionSchema,
  holdPickupWindowSchema,
} = require("../models/joiSchema");
const wrapAsync = require("../utils/wrapAsync");
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
router.post(
  "/hold_window",
  validateBody(holdPickupWindowSchema),
  checkValidToken,
  wrapAsync(holdPickupWindow),
);

module.exports = router;
