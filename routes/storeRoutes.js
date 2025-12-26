const express = require("express");
const router = express.Router();

const getStores = require("../controllers/storeController");
const { checkValidToken } = require("../middleware/auth");
const { getStoreSchema } = require("../models/joiSchema");
const { validateBody } = require("../middleware/validate");

router.post(
  "/get_stores",
  validateBody(getStoreSchema),
  checkValidToken,
  getStores
);

module.exports = router;
