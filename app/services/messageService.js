const db = require("../core/db");

async function saveMessage(roomId, senderId, text, type = "text", metadata = {}) {
  const result = await db.query(
    "INSERT INTO messages (room_id, sender_id, text, type, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [roomId, senderId, text, type, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

async function getRoomMessages(roomId, limit = 50) {
  const result = await db.query(
    `SELECT m.id, m.text, m.type, m.metadata, m.created_at, u.username as sender
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.room_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2`,
    [roomId, limit]
  );
  return result.rows;
}

module.exports = { saveMessage, getRoomMessages };
