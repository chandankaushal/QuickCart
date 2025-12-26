const pino = require("pino");
const path = require("path");

const logger = pino(
  {
    level: "debug",
    base: {
      service: process.env.SERVICE_NAME,
      env: process.env.ENVIRONMENT,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(path.join(__dirname, "../logs/quickcart.log"))
);

module.exports = logger;
