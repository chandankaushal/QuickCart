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

module.exports = { sendError, sendSuccess };
