const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { createClient } = require("redis");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const pub = createClient({ url: process.env.REDIS_URL });
const sub = createClient({ url: process.env.REDIS_URL });

async function startRedis() {
    try {
        await pub.connect();
        await sub.connect();
        console.log("✅ Connected to Redis");
    } catch (error) {
        console.error("🚨 Redis Connection Failed:", error);
    }
}
startRedis();

sub.subscribe("chat");

let clients = new Set();

wss.on("connection", (ws) => {
    console.log("🔗 New client connected");
    clients.add(ws);

    ws.on("message", (message) => {
        console.log("📩 Received message:", message.toString());
        pub.publish("chat", message.toString());
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
        clients.delete(ws);
    });
});

// Listen for messages from Redis and broadcast to WebSocket clients
sub.on("message", (channel, message) => {
    console.log(`📢 Broadcasting message: ${message}`);
    clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
});

// 🚀 **Fix for 404 Errors: Serve a Simple HTTP Response**
app.get("/", (req, res) => {
    res.send("✅ WebSocket server is running.");
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
