const { createClient } = require("redis");
const logger = require("./logger");

let cacheClient = null;
let counter = 0;

async function connect(log = logger) {
  if (cacheClient) {
    return true;
  }

  try {
    cacheClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        // retry forever with backoff
        reconnectStrategy: (retries) => {
          return Math.min(retries * 200, 10000);
        },
      },
    });
    cacheClient.on("ready", () => {
      log.info("Redis is connected");
      counter = 0;
    });
    cacheClient.on("error", (err) => {
      counter++;
      log.error(
        { redisError: { code: err.code, stack: err.stack } },
        `Redis is down, retrying in the background. Attempt Number ${counter}`,
      );
    });
    await cacheClient.connect();

    return true;
  } catch (err) {
    cacheClient = null;
    log.warn({ err }, "Redis connection failed (will continue without cache)");
    return false;
  }
}

function getClient(log = logger) {
  if (!cacheClient) {
    log.warn("Redis is not Connected");
    return;
  }
  return cacheClient;
}

async function startRedis(log = logger) {
  await connect(log);
}

module.exports = { connect, getClient, startRedis };
