const { getClient } = require("./redisDb");
// ...args collect all extra arguments into an array
async function withCache(key, workFunc, ttl, log, ...args) {
  const cache = getClient();
  const cacheKey = key;
  let cached = null;
  try {
    if (cache && cache.isReady) {
      const raw = await cache.get(cacheKey);
      cached = raw ? JSON.parse(raw) : null;
    }
  } catch (err) {
    log.error({ err }, "Cache read failed, falling back to DB");
    cached = null;
  }
  if (cached !== null) {
    log.info("Returning From Cache");
    return cached;
  } else {
    //uses the same ...args to spread that array back out into separate arguments when calling workFunc
    log.info("Returning From DB");
    const result = await workFunc(...args);
    try {
      if (cache && cache.isReady) {
        await cache.set(key, JSON.stringify(result), { EX: ttl });
      }
    } catch (err) {
      log.error({ err }, "There was an error in saving the cache");
    }
    return result;
  }
}

module.exports = { withCache };
