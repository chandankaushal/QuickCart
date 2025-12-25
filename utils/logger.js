const pino = require("pino");

const logger = pino({
  level: "debug",
  base: {
    service: process.env.SERVICE_NAME,
    env: process.env.ENVIRONMENT,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
