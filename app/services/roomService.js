const db = require("../core/db");

async function getAllRooms() {
  const result = await db.query("SELECT * FROM rooms ORDER BY name ASC");
  return result.rows;
}

async function createRoom(name, description) {
  const result = await db.query(
    "INSERT INTO rooms (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  return result.rows[0];
}

async function getRoomByName(name) {
  const result = await db.query("SELECT * FROM rooms WHERE name = $1", [name]);
  return result.rows[0];
}

async function joinRoom(userId, roomId) {
  await db.query(
    "INSERT INTO room_members (user_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, roomId]
  );
}

module.exports = { getAllRooms, createRoom, getRoomByName, joinRoom };
