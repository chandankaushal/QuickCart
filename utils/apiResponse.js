function sendError(res, message, status = 400) {
  return res.status(status).json({
    status: "error",
    message,
  });
}

function sendSuccess(res, message, data = {}, status = 200) {
  return res.status(status).json({
    status: "success",
    message,
    data,
  });
}

module.exports = { sendError, sendSuccess };
