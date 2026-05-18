const express = require("express");
const router = express.Router();
const { handleMcpLogin } = require("../controllers/mcpController");
const { checkMcpAuthToken } = require("../middleware/auth");

const wrapAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// we can have a limited number of ai agents.

router.post("/authenticate", checkMcpAuthToken, wrapAsync(handleMcpLogin));

module.exports = router;
