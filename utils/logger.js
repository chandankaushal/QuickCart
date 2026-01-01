const fs = require("fs");
const pino = require("pino");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const destination =
  process.env.NODE_ENV === "test" || process.env.CI
    ? pino.destination(1) // stdout in CI/tests
    : pino.destination(path.join(logDir, "quickcart.log"));

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
  destination
);

module.exports = logger;
