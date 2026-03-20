require("dotenv").config();
const {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const sqs = require("../utils/aws/sqsClient");
const sendEmail = require("../utils/aws/ses_email");

const logger = require("../utils/logger");
const sendWebhook = require("../utils/sendWebhook");
const { ORDER_EVENT_TYPES } = require("../utils/eventTypes");

const QUEUE_URL = process.env.SQS_QUEUE_URL;

async function pollQueue() {
  logger.info("📩 Worker started. Waiting for messages...");

  while (true) {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 2, // long polling
      MessageSystemAttributeNames: ["MessageGroupId"],
    });
    try {
      const response = await sqs.send(command);
      if (!response.Messages) continue;

      // console.log(`Messages in Queue ${response.Messages.length}`);
      for (const msg of response.Messages) {
        const job = JSON.parse(msg.Body);
        const groupId = msg.Attributes?.MessageGroupId;

        if (groupId === "create_order") {
          logger.info({ order_id: job.id }, "Got Create Order in Queue");
          await sendWebhook(job, ORDER_EVENT_TYPES.created, logger);
        } else if (groupId === "SIGNUP_EMAIL") {
          logger.info({ email: job.email }, "Sending Signup email");
          await sendEmail({
            to: job.email,
            subject: job.subject,
            body: job.body,
          });
        } else {
          logger.warn(
            { groupId, body: msg.Body },
            "Unknown message group; deleting",
          );
        }

        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle,
          }),
        );
      }
      logger.info("Job Completed. Email queue is empty.");
    } catch (err) {
      logger.error(`There was an error in the email Worker${err}`);
      // Do NOT delete message → SQS will retry automatically
    }
  }
}

(async () => await pollQueue())();
