const { publisher, subscriber } = require("../core/redis");
const messageService = require("../services/messageService");
const roomService = require("../services/roomService");
const userService = require("../services/userService");

const clients = new Map(); // userId -> Set of WS connections

const MAX_CONNECTIONS = 1000;
let currentConnections = 0;

function setupWebSocket(wss) {
  wss.on("connection", async (ws, req) => {
    if (currentConnections >= MAX_CONNECTIONS) {
       ws.close(1008, "Max connections reached");
       return;
    }
    currentConnections++;
    
    // For now, we'll use a simplified join logic (similar to existing)
    // but with room support. Production should use JWT from query or header.
    console.log("🔗 New client connected");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data);
        const { type, sender, room = "General", text, metadata = {} } = message;

        if (type === "join") {
          ws.username = sender;
          ws.room = room;
          
          const roomData = await roomService.getRoomByName(room);
          if (!roomData) return;
          
          ws.roomId = roomData.id;
          
          // Subscribe client to room-based Redis channel if not already
          // (Actually, we'll use a single 'chat_messages' channel and filter in the subscriber)
          // or multiple channels. Let's use room-specific channels for scalability.
          
          await subscriber.subscribe(`room:${room}`, (msg) => {
             ws.send(msg);
          });

          // Fetch and send history
          const history = await messageService.getRoomMessages(ws.roomId);
          ws.send(JSON.stringify({ type: "history", data: history }));
          
          // Notify others
          const joinMsg = JSON.stringify({ type: "join", sender, room, time: new Date().toLocaleTimeString() });
          await publisher.publish(`room:${room}`, joinMsg);
          return;
        }

        if (type === "message") {
          const roomData = await roomService.getRoomByName(room);
          const userData = await userService.getUserByUsername(sender);
          
          if (!roomData || !userData) return;

          // Save to DB
          await messageService.saveMessage(roomData.id, userData.id, text, "text", metadata);

          // Publish to Redis for horizontal scalability
          const chatMsg = {
            type: "message",
            sender,
            text,
            room,
            metadata,
            time: new Date().toLocaleTimeString()
          };
          await publisher.publish(`room:${room}`, JSON.stringify(chatMsg));

          // Check for AI trigger
          if (text.toLowerCase().startsWith("@ai")) {
            const aiPrompt = text.slice(3).trim();
            const aiResponseText = await require("../services/aiService").getChatResponse(aiPrompt);
            
            const aiUser = await userService.getUserByUsername("AI_Assistant");
            if (aiUser) {
              await messageService.saveMessage(roomData.id, aiUser.id, aiResponseText, "text");
              
              const aiMsg = JSON.stringify({
                type: "message",
                sender: "AI_Assistant",
                text: aiResponseText,
                room,
                time: new Date().toLocaleTimeString()
              });
              await publisher.publish(`room:${room}`, aiMsg);
            }
          }
        }

        if (type === "typing") {
           const typingMsg = JSON.stringify({ type: "typing", sender, room });
           await publisher.publish(`room:${room}`, typingMsg);
        }

      } catch (err) {
        console.error("❌ Error handling WebSocket message:", err);
      }
    });

    ws.on("close", async () => {
      currentConnections--;
      if (ws.username && ws.room) {
        const leaveMsg = JSON.stringify({
          type: "leave",
          sender: ws.username,
          room: ws.room,
          time: new Date().toLocaleTimeString()
        });
        await publisher.publish(`room:${ws.room}`, leaveMsg);
        await subscriber.unsubscribe(`room:${ws.room}`);
      }
      console.log("❌ Client disconnected");
    });
  });
}

module.exports = { setupWebSocket };
