require("dotenv").config();

const { sendSuccess } = require("../utils/apiResponse");
const { UnauthorizedError } = require("../utils/ExpressError");
const { handleRunwareWebhook } = require("../service/runwareService");

async function handleWebhook(req, res) {
  if (req.query.apiKey != process.env.RUNWARE_WEBHOOK_API_KEY) {
    throw new UnauthorizedError();
  }
  req.log.info("Received Runware Webhook:");

  sendSuccess(res, "Webhook received", { success: true }, 200);
  await handleRunwareWebhook(req.body, req.log);
}

module.exports = { handleWebhook };
