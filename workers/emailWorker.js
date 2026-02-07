require("dotenv").config();
const {
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const sqs = require("../utils/aws/sqsClient");
const sendEmail = require("../utils/aws/ses_email");

const QUEUE_URL = process.env.SQS_QUEUE_URL;

async function pollQueue() {
  console.log("📩 Worker started. Waiting for messages...");

  while (true) {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 2, // long polling
    });
    try {
      const response = await sqs.send(command);
      console.log(`${response.Messages.length.hello}`);
      if (!response.Messages) continue;

      for (const msg of response.Messages) {
        const job = JSON.parse(msg.Body);
        console.log(`Sending Email to ${job.email}`);

        // console.log("Processing job:", job);

        if (job.type === "SIGNUP_USER") {
          console.log(`Sending Signup email to:${job.email}`);
          await sendEmail({
            to: job.email,
            subject: job.subject,
            body: job.body,
          });
        }
      }

      // ✅ Delete message after success
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        }),
      );

      console.log("✅ Job completed. Please check the queue");
    } catch (err) {
      console.log(`${err}`);
      // Do NOT delete message → SQS will retry automatically
    }
  }
}

(async () => await pollQueue())();
