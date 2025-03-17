const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { createClient } = require("redis");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    console.error("❌ ERROR: REDIS_URL is not set!");
    process.exit(1);
}

// ✅ Create Redis Clients
const pub = createClient({ url: redisUrl });
const sub = createClient({ url: redisUrl });

async function startRedis() {
    try {
        await pub.connect();
        await sub.connect();
        console.log("✅ Connected to Redis!");

        // ✅ FIX: Proper WebSocket broadcasting inside Redis subscription
        await sub.subscribe("chat", (message) => {
            console.log(`📢 Broadcasting message from Redis: ${message}`);
            wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN === 1
                    client.send(message);
                }
            });
        });

    } catch (error) {
        console.error("🚨 Redis Connection Failed:", error);
        process.exit(1);
    }
}

startRedis();

// ✅ WebSocket Server Handling
wss.on("connection", (ws) => {
    console.log("🔗 New client connected");

    ws.on("message", async (message) => {
        console.log(`📩 Received message: ${message}`);
        await pub.publish("chat", message.toString()); // Publishes to Redis
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
