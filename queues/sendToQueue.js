require("dotenv").config();
const { SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqs = require("../utils/aws/sqsClient");
const crypto = require("crypto");

async function sendToQueue(payload, group_id) {
  const uniqueId = crypto.randomUUID();
  try {
    console.log(`Sending group_id ${group_id}`);
    const resp = await sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
        MessageGroupId: group_id,
        MessageDeduplicationId: uniqueId,
      }),
    );

    return { messageId: resp.MessageId };
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = sendToQueue;
