const express = require("express");
const router = express.Router();
const { handleMcpLogin } = require("../controllers/mcpController");
// we can have a limited number of ai agents.

router.post("/authenticate", handleMcpLogin);

module.exports = router;
