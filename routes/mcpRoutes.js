const express = require("express");
const router = express.Router();
const { handleMcpLogin } = require("../controllers/mcpController");
const { checkMcpAuthToken } = require("../middleware/auth");
// we can have a limited number of ai agents.

router.post("/authenticate", checkMcpAuthToken, handleMcpLogin);

module.exports = router;
