require("dotenv").config();
const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqs = require("../utils/aws/sqsClient");
const crypto = require("crypto");

async function enqueueEmailJob(payload) {
  const uniqueId = crypto.randomUUID();
  try {
    const resp = await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
        MessageGroupId: "default",
        MessageDeduplicationId: uniqueId,
      }),
    );

    return { messageId: resp.MessageId };
  } catch (err) {
    console.log(err);
  }
}

module.exports = enqueueEmailJob;
