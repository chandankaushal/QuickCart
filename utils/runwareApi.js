require("dotenv").config();
const crypto = require("crypto");
const { InternalServerError } = require("./ExpressError");
const logger = require("./logger");
const Runware = require("../models/runwareModel");

const MAX_RETRIES = 3;

async function generateImage(prompt, log = logger) {
  const url = process.env.RUNWARE_API_URL;
  const apiKey = process.env.RUNWARE_API_KEY;
  const webhookBaseUrl = process.env.RUNWARE_WEBHOOK_BASE_URL;
  const webhookUrl = `${webhookBaseUrl}/runware/webhook?apiKey=${encodeURIComponent(
    process.env.RUNWARE_WEBHOOK_API_KEY,
  )}`;
  try {
    let body = JSON.stringify([
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
    ]);
    log.info("Calling Runware API");
    let response;

    for (let i = 0; i < MAX_RETRIES; i++) {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body,
      });

      if (response.status != 429 && response.status != 503) {
        break;
      }
      if (i === MAX_RETRIES - 1) {
        log.error(`Runware unavailable after ${MAX_RETRIES} attempts`);
        throw new InternalServerError();
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    }

    let result = await response.json();
    await Promise.all(
      result.data.map(async (task) => {
        await Runware.addTask(task.taskUUID, task.taskType);
      }),
    );
    return result.data;
  } catch (err) {
    log.error({ err }, "Runware API Error");
    throw new InternalServerError();
  }
}
module.exports = { generateImage };
