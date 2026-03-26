import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import EmojiPicker from "emoji-picker-react";
import { FaRegSmile, FaSmile } from "react-icons/fa";
import { EmojiClickData } from "emoji-picker-react";
import { FaPaperPlane, FaMicrophone, FaUser, FaUsers, FaMoon, FaSun, FaPaperclip, FaPlus } from "react-icons/fa6";
import "./Chat.css";
import { roomApi } from "./api";

const WS_URL = "ws://localhost:3000";

interface ChatMessage {
  id?: number;
  sender: string;
  text?: string;
  time: string;
  type?: string;
  metadata?: any;
}

const Chat: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [input, setInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState("General");
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  const { sendMessage, lastMessage } = useWebSocket(WS_URL, {
    shouldReconnect: (closeEvent) => true,
  });

  // Fetch rooms on mount
  useEffect(() => {
    // In a real app, we'd use a token. For now, we'll bypass auth for simplicity
    // or provide a dummy token if the backend requires it.
    const fetchRooms = async () => {
        try {
            // const res = await roomApi.list("dummy-token");
            // setRooms(res.data);
            setRooms([{ id: 1, name: "General" }, { id: 2, name: "AI_Help" }]);
        } catch (err) {
            console.error("Failed to fetch rooms", err);
        }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      
      if (data.type === "history") {
        setMessages(data.data.map((m: any) => ({
            ...m,
            time: new Date(m.created_at).toLocaleTimeString()
        })));
        return;
      }

      if (data.type === "join") {
        setOnlineUsers((prev) => [...new Set([...prev, data.sender])]);
        return;
      }

      if (data.type === "leave") {
        setOnlineUsers((prev) => prev.filter((user) => user !== data.sender));
        return;
      }

      if (data.type === "typing" && data.sender !== username) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
        return;
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
      }
    }
  }, [lastMessage, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoinChat = () => {
    if (username.trim() !== "") {
      setIsJoined(true);
      sendMessage(JSON.stringify({ type: "join", sender: username, room: currentRoom }));
    }
  };

  const handleSend = () => {
    if (input.trim() === "") return;

    const messageData = {
      type: "message",
      sender: username,
      text: input,
      room: currentRoom,
    };

    sendMessage(JSON.stringify(messageData));
    setInput("");
  };

  const switchRoom = (roomName: string) => {
    if (roomName === currentRoom) return;
    setMessages([]);
    setCurrentRoom(roomName);
    sendMessage(JSON.stringify({ type: "join", sender: username, room: roomName }));
  };

  if (!isJoined) {
    return (
      <div className="join-screen">
        <div className="join-card">
          <h1>🚀 Scalable Chat</h1>
          <p>Real-time, AI-powered, Production Grade</p>
          <input
            type="text"
            placeholder="Enter your username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinChat()}
          />
          <button onClick={handleJoinChat}>Join Chat</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
      <div className="sidebar">
        <h2><FaUsers /> Rooms</h2>
        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`room-item ${currentRoom === room.name ? "active" : ""}`}
              onClick={() => switchRoom(room.name)}
            >
              # {room.name}
            </div>
          ))}
        </div>
        <div className="online-section">
            <h3>Online ({onlineUsers.length})</h3>
            <div className="user-list">
                {onlineUsers.map(user => (
                    <div key={user} className="user-pill">{user}</div>
                ))}
            </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2># {currentRoom}</h2>
          <div className="header-actions">
            <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
               {darkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>

        <div className="chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.sender === username ? "sent" : "received"} ${msg.sender === "AI_Assistant" ? "ai" : ""}`}>
              <div className="msg-info">
                <strong>{msg.sender}</strong>
                <span>{msg.time}</span>
              </div>
              <div className="msg-content">
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {isTyping && <div className="typing-indicator">Someone is typing...</div>}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type @ai for help..."
            value={input}
            onChange={(e) => {
                setInput(e.target.value);
                if (input.length % 5 === 0) {
                    sendMessage(JSON.stringify({ type: "typing", sender: username, room: currentRoom }));
                }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} className="send-btn">
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
