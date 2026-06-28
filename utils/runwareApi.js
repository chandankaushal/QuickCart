require("dotenv").config();
const crypto = require("crypto");
const { ExpressError } = require("./ExpressError");
const logger = require("./logger");
const Runware = require("../models/runwareModel");
async function generateImage(prompt, log = logger) {
  const url = process.env.RUNWARE_API_URL;
  const apiKey = process.env.RUNWARE_API_KEY;
  const webhookBaseUrl = process.env.RUNWARE_WEBHOOK_BASE_URL;
  const webhookUrl = `${webhookBaseUrl}/runware/webhook?apiKey=${encodeURIComponent(
    process.env.RUNWARE_WEBHOOK_API_KEY,
  )}`;
  try {
    log.info("Calling Runware API");
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify([
        {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          model: "ideogram:4@0",
          positivePrompt: prompt,
          width: 2048,
          height: 2048,
          deliveryMethod: "async",
          webhookURL: webhookUrl,
          includeCost: true,
        },
      ]),
    });
    let result = await response.json();
    await Promise.all(
      result.data.map(async (task) => {
        await Runware.addTask(task.taskUUID, task.taskType);
      }),
    );
    return result.data;
  } catch (err) {
    log.error({ err }, "Runware API Error");
    throw new ExpressError(
      "There was an Issue with Runware API",
      500,
      "RUNWARE_ERROR",
    );
  }
}
module.exports = { generateImage };
