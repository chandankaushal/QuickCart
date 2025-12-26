const pinoHttp = require("pino-http");
const logger = require("../utils/logger");
const crypto = require("crypto");

const pinoMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),

  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  customSuccessMessage: (req, res) =>
    `Request completed: ${req.id} ${req.method} ${req.url} - Status ${res.statusCode}`, // need to change this
});

module.exports = pinoMiddleware;
