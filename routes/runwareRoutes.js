const express = require("express");
const { handleWebhook } = require("../controllers/runwareController");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");

router.post("/webhook", wrapAsync(handleWebhook));

module.exports = router;
