require("dotenv").config();
const nodemailer = require("nodemailer");
const { ExpressError } = require("../ExpressError");
const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_ENDPOINT,
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.SES_SMTP_USERNAME,
    pass: process.env.SES_SMTP_PASSWORD,
  },
});

async function sendEmail({
  to = "chandankaushalwork@gmail.com",
  subject,
  body,
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SES_FROM_EMAIL_ADDRESS,
      to: to,
      subject: subject,
      text: body, // Plain-text version of the message
      // html: "<b>Hello world?</b>", // HTML version of the message
    });
    console.log(`Sending Email to ${to}`);
    return info;
  } catch (error) {
    throw new ExpressError(
      `There was a problem in sending the verification email ${error}`,
      500,
      "EMAIL_SEND_ERROR",
    );
  }
}

module.exports = sendEmail;
