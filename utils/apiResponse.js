function sendError(res, message, status = 400) {
  return res.status(status).json({
    status: "error",
    message,
  });
}

function sendSuccess(res, message = null, data = {}, status = 200) {
  const response = {
    status: "success",
  };
  if (message) response.message = message;
  if (data) response.data = data;

  return res.status(status).json(response);
}
function setRefreshTokenCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

module.exports = { sendError, sendSuccess, setRefreshTokenCookie };
