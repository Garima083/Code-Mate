// // server/config/redis.js
// const redis = require("redis");

// // This creates the client. It will try to connect to localhost:6379 by default.
// const redisClient = redis.createClient();

// // Add detailed event listeners to see exactly what's happening
// redisClient.on("error", (err) => console.error("🔴 Redis Client Error", err));
// redisClient.on("connect", () => console.log("🟢 Redis is connecting..."));
// redisClient.on("ready", () =>
//   console.log("🔵 Redis client is ready and connected!")
// );
// redisClient.on("reconnecting", () =>
//   console.log("🟡 Redis client is reconnecting...")
// );

// const connectRedis = async () => {
//   try {
//     await redisClient.connect();
//   } catch (err) {
//     console.error("Failed to connect to Redis on startup:", err);
//     process.exit(1); // Exit the app if Redis connection fails, as it's critical
//   }
// };

// module.exports = { connectRedis, redisClient };

// server/config/redis.js
const redis = require('redis');

// Create a primary client for pushing commands
const publisherClient = redis.createClient();
publisherClient.on('error', err => console.error('🔴 Redis Publisher Client Error', err));

// Create a duplicate client dedicated to blocking commands for the worker
const subscriberClient = publisherClient.duplicate();
subscriberClient.on('error', err => console.error('🔴 Redis Subscriber Client Error', err));

const connectRedis = async () => {
    await Promise.all([
        publisherClient.connect(),
        subscriberClient.connect()
    ]);
    console.log('🔵 Redis Publisher and Subscriber clients are connected and ready!');
};

module.exports = { connectRedis, publisherClient, subscriberClient };