require("dotenv").config();
const axios = require("axios");
const { ExpressError } = require("../utils/ExpressError");
const logger = require("./logger");
async function sendWebhook(order, type, log = logger) {
  try {
    log.info(`Sending Webhook to ${process.env.WEBHOOK_URL}`);
    const response = await axios.post(
      process.env.WEBHOOK_URL,
      {
        ...order,
        type: type,
        // type: "ORDER_CREATED",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // optional: set a timeout in ms
      },
    );
    return response.data;
  } catch (error) {
    throw new ExpressError(
      "There was an error creating Order in the Order Management System",
      500,
      "OMS_ERROR",
    );
  }
}

module.exports = sendWebhook;
