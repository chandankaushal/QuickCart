const { createClient } = require("redis");
const logger = require("./logger");

// Simple Redis helper:
// - Call `await connect()` once at app startup.
// - Then use `getClient()` to access the connected client.

let cacheClient = null;

async function connect(log = logger) {
  if (cacheClient) return cacheClient;

  cacheClient = createClient({ url: process.env.REDIS_URL });
  cacheClient.on("error", (err) => log.error("Redis Client Error", err));

  await cacheClient.connect();
  log.info("Redis is connected!");

  return cacheClient;
}

function getClient(log = logger) {
  if (!cacheClient) {
    log.warn("Redis is not Connected");
    return;
  }
  return cacheClient;
}

module.exports = { connect, getClient };
