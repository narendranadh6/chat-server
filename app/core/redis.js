const { createClient } = require("redis");
const config = require("./config");

const client = createClient({ url: config.REDIS_URL });
const publisher = createClient({ url: config.REDIS_URL });
const subscriber = createClient({ url: config.REDIS_URL });

client.on("error", (err) => console.error("🚨 Redis Client Error", err));
publisher.on("error", (err) => console.error("🚨 Redis Publisher Error", err));
subscriber.on("error", (err) => console.error("🚨 Redis Subscriber Error", err));

async function connectRedis() {
  await client.connect();
  await publisher.connect();
  await subscriber.connect();
  console.log("✅ Redis connected successfully");
}

module.exports = {
  client,
  publisher,
  subscriber,
  connectRedis,
};
