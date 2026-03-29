require("dotenv").config();
const nodemailer = require("nodemailer");
const { ExpressError, InternalServerError } = require("../ExpressError");
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
    throw new InternalServerError();
  }
}

module.exports = sendEmail;
