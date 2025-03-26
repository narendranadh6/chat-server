import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { FaPaperPlane, FaMicrophone, FaFile, FaUser, FaUsers, FaMoon, FaSun } from "react-icons/fa6";
import "./Chat.css"; // ✅ Add a CSS file for better styling

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
  sender: string;
  text?: string;
  time: string;
  type?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
}

const Chat: React.FC = () => {
  const { sendMessage, lastMessage } = useWebSocket(WS_URL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastMessage !== null) {
      const receivedData: ChatMessage = JSON.parse(lastMessage.data);

      // Prevent duplicate messages
      setMessages((prev) => {
        const exists = prev.some(
          (msg) =>
            msg.sender === receivedData.sender &&
            msg.text === receivedData.text &&
            msg.time === receivedData.time
        );
        return exists ? prev : [...prev, receivedData];
      });

      // Add user to online users list
      if (receivedData.type === "join") {
        setOnlineUsers((prev) => [...new Set([...prev, receivedData.sender])]);
      }

      if (receivedData.type === "typing" && receivedData.sender !== username) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }
  }, [lastMessage, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoinChat = () => {
    if (input.trim() !== "") {
      setUsername(input);
      sendMessage(JSON.stringify({ sender: input, text: `${input} joined the chat`, type: "join", time: new Date().toLocaleTimeString() }));
      setInput("");
    }
  };

  const handleSend = () => {
    if (input.trim() === "" || username.trim() === "") return;

    const messageData = {
      sender: username,
      text: input,
      time: new Date().toLocaleTimeString(),
      type: "message",
    };

    sendMessage(JSON.stringify(messageData));
    setInput("");
  };

  const handleTyping = () => {
    sendMessage(JSON.stringify({ sender: username, type: "typing" }));
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);

    recorder.ondataavailable = (event) => {
      setAudioChunks((prev) => [...prev, event.data]);
    };
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setIsRecording(false);

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audioMessage = {
        sender: username,
        audioUrl,
        time: new Date().toLocaleTimeString(),
        type: "audio",
      };

      sendMessage(JSON.stringify(audioMessage));
      setMessages((prev) => [...prev, audioMessage]);
      setAudioChunks([]);
    };
  };

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`}>
      <div className="chat-header">
        <h2>💬 Chat App</h2>
        <button className="toggle-theme" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {username && (
        <div className="chat-info">
          <FaUser /> You joined as <b>{username}</b>
        </div>
      )}

      {!username ? (
        <div className="join-container">
          <input
            type="text"
            placeholder="Enter your name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="chat-input"
          />
          <button onClick={handleJoinChat} className="join-btn">Join</button>
        </div>
      ) : (
        <>
          <div className="chat-box">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender === username ? "sent" : "received"}`}>
                <strong>{msg.sender}: </strong>
                {msg.text && <span>{msg.text}</span>}
                {msg.audioUrl && <audio controls src={msg.audioUrl} />}
                <small>{msg.time}</small>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isTyping && <p className="typing-indicator">Someone is typing...</p>}
          </div>

          <div className="input-area">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="chat-input"
            />
            <button onClick={handleSend} className="send-btn"><FaPaperPlane /></button>
            <button onClick={startRecording} className="record-btn"><FaMicrophone /></button>
          </div>
        </>
      )}

      <div className="online-users">
        <FaUsers /> Online: {onlineUsers.join(", ") || "No one"}
      </div>
    </div>
  );
};

export default Chat;
