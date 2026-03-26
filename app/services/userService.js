const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../core/db");
const config = require("../core/config");

async function register(username, password) {
  const hash = await bcrypt.hash(password, 10);
  const result = await db.query(
    "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
    [username, hash]
  );
  return result.rows[0];
}

async function login(username, password) {
  const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error("Invalid username or password");
  }
  const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, {
    expiresIn: "24h",
  });
  return { user: { id: user.id, username: user.username }, token };
}

async function getUserByUsername(username) {
  const result = await db.query("SELECT id, username FROM users WHERE username = $1", [username]);
  return result.rows[0];
}

module.exports = { register, login, getUserByUsername };
