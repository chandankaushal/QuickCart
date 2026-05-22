const { loginAgentByUserPhone } = require("../service/userService");
const { sendSuccess } = require("../utils/apiResponse");
async function handleMcpLogin(req, res) {
  const { email } = req.body;
  const response = await loginAgentByUserPhone(email, "id", req.log);
  sendSuccess(res, "Authenticated", response, 200);
}

module.exports = { handleMcpLogin };
