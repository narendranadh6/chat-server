//import express from "express";
//import { createServer } from "http";
//import { WebSocketServer } from "ws"; // Correct import for WebSockets
//import { createClient } from "redis";

const express = require("express");
const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { createClient } = require("redis");


// Create Express app and HTTP server
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const { createClient } = require("redis");


// Set up Redis for Pub/Sub
const pub = createClient();
const sub = createClient();
await pub.connect();
await sub.connect();

sub.subscribe("chat");

let clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("message", (message) => {
    pub.publish("chat", message.toString());
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

// Listen for messages from Redis and broadcast to WebSocket clients
sub.on("message", (channel, message) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
