const EMAIL_VERIFY_BASE_URL =
  process.env.EMAIL_VERIFY_URL || "http://localhost:2000";
const SIGNUP_EMAIL_SUBJECT = "Welcome to QuickCart";
const SIGNUP_EMAIL_BEFORE_TOKEN_TEXT =
  "Please click on the link to verify your account";
const SIGNUP_EMAIL_PATH_URL = "/users/email-verify?token_id=";

function buildSignupEmailBody(tokenId) {
  return `${SIGNUP_EMAIL_BEFORE_TOKEN_TEXT} ${EMAIL_VERIFY_BASE_URL}${SIGNUP_EMAIL_PATH_URL}${tokenId}`;
}

module.exports = {
  EMAIL_VERIFY_BASE_URL,
  SIGNUP_EMAIL_SUBJECT,
  buildSignupEmailBody,
};
