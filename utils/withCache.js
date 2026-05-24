const { getClient } = require("./redisDb");
// ...args collect all extra arguments into an array
async function withCache(key, workFunc, ttl, log, ...args) {
  const cache = getClient();
  const cacheKey = key;
  const cached = cache ? await cache.get(cacheKey) : null;
  if (cached) {
    log.info("Returning From Cache");
    return JSON.parse(cached);
  } else {
    //uses the same ...args to spread that array back out into separate arguments when calling workFunc
    log.info("Returning From DB");
    const result = await workFunc(...args);
    try {
      if (cache) {
        await cache.set(key, JSON.stringify(result), { EX: ttl });
      }
    } catch (err) {
      log.error({ err }, "There was an error in saving the cache");
    }
    return result;
  }
}

module.exports = { withCache };
