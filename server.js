const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const config = require("./app/core/config");
const { connectRedis } = require("./app/core/redis");
const { initDatabase } = require("./app/services/dbInitService");
const apiRoutes = require("./app/api");
const { setupWebSocket } = require("./app/websockets/handler");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later",
});

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use("/api", limiter);

  // API Routes
  app.use("/api", apiRoutes);

  // Initialize DB and Redis
  try {
    await initDatabase();
    await connectRedis();
    console.log("✅ Background services initialized");
  } catch (err) {
    console.error("🚨 Failed to initialize background services", err);
    process.exit(1);
  }

  // Setup WebSockets
  setupWebSocket(wss);

  // Health check
  app.get("/health", (req, res) => res.status(200).send("OK"));

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error("🚨 Global Error:", err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  });

  // Start Server
  server.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
  });
}

startServer();
