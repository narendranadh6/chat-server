const fs = require("fs");
const path = require("path");
const db = require("../core/db");

async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, "../models/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await db.query(schema);
    console.log("✅ Database initialized successfully");
  } catch (err) {
    console.error("🚨 Failed to initialize database", err);
    throw err;
  }
}

module.exports = { initDatabase };
