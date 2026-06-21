const { createClient } = require("redis");
const logger = require("./logger");

// Simple Redis helper:
// - Call `await connect()` once at app startup.
// - Then use `getClient()` to access the connected client.

let cacheClient = null;

let redisHealthy = false;

let firstConnection = true;

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
      if (!redisHealthy) {
        redisHealthy = true;
        firstConnection = false;
        log.info("Redis is connected");
      }
    });
    cacheClient.on("error", (err) => {
      if (redisHealthy || firstConnection) {
        redisHealthy = false;
        firstConnection = false;
        log.warn({ err }, "Redis is down, retrying in the background");
      }
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
