const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { createClient } = require("redis");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const redisUrl = process.env.REDIS_URL;

const pub = createClient({ url: redisUrl });
const sub = createClient({ url: redisUrl });

async function startRedis() {
    try {
        await pub.connect();
        await sub.connect();
        console.log("✅ Connected to Redis!");

        // ✅ FIX: Subscribe with a callback function
        await sub.subscribe("chat", (message, channel) => {
            console.log(`📢 Broadcasting message from Redis: ${message}`);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
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

wss.on("connection", (ws) => {
    console.log("🔗 New client connected");

    ws.on("message", async (message) => {
        console.log(`📩 Received message: ${message}`);
        await pub.publish("chat", message.toString()); // Publishes message to Redis
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
