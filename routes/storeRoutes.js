const express = require("express");
const router = express.Router();

const get_stores = require("../controllers/storeController");
const { checkValidToken } = require("../middleware/auth");
const { getStoreSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/get_stores",
  validateBody(getStoreSchema),
  checkValidToken,
  get_stores
);

module.exports = router;
