const pino = require("pino");
const path = require("path");

const logger = pino(
  {
    level: "debug",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    base: {
      service: process.env.SERVICE_NAME,
      env: process.env.ENVIRONMENT,
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  },
  pino.destination(path.join(__dirname, "../logs/quickcart.log"))
);

module.exports = logger;
