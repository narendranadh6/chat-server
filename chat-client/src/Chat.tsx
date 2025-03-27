import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import EmojiPicker from "emoji-picker-react";
import { FaRegSmile, FaSmile } from "react-icons/fa";

import { EmojiClickData } from "emoji-picker-react";
import { FaPaperPlane, FaMicrophone, FaUser, FaUsers, FaMoon, FaSun, FaPaperclip } from "react-icons/fa6";
import "./Chat.css";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
  sender: string;
  text?: string;
  time: string;
  type?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  seen?: boolean;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDuplicate = (newMsg: ChatMessage) => {
    return messages.some(
      (msg) =>
        msg.sender === newMsg.sender &&
        msg.type === newMsg.type &&
        msg.time === newMsg.time &&
        msg.text === newMsg.text &&
        msg.audioUrl === newMsg.audioUrl &&
        msg.fileUrl === newMsg.fileUrl
    );
  };

  useEffect(() => {
    if (lastMessage !== null) {
      const receivedData: ChatMessage = JSON.parse(lastMessage.data);
      if (isDuplicate(receivedData)) return;

      if (receivedData.type === "join") {
        setMessages((prev) => [...prev, receivedData]);
        setOnlineUsers((prev) => [...new Set([...prev, receivedData.sender])]);
        return;
      }

      if (receivedData.type === "leave") {
        setMessages((prev) => [...prev, receivedData]);
        setOnlineUsers((prev) => prev.filter((user) => user !== receivedData.sender));
        return;
      }

      if (receivedData.type === "typing" && receivedData.sender !== username) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
        return;
      }

      if (receivedData.sender !== username && (receivedData.text || receivedData.audioUrl || receivedData.fileUrl)) {
        receivedData.seen = true;
        setMessages((prev) => [...prev, receivedData]);
      }
    }
  }, [lastMessage, messages, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (username) {
        sendMessage(JSON.stringify({ sender: username, text: `${username} exited the chat`, type: "leave", time: new Date().toLocaleTimeString() }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [username, sendMessage]);

  const handleJoinChat = () => {
    if (input.trim() !== "") {
      setUsername(input);
      sendMessage(JSON.stringify({ sender: input, text: `${input} joined the chat`, type: "join", time: new Date().toLocaleTimeString() }));
      setInput("");
    }
  };

  const handleSend = () => {
    if (file) return handleFileSend();
    if (input.trim() === "" || username.trim() === "") return;

    const messageData = {
      sender: username,
      text: input,
      time: new Date().toLocaleTimeString(),
      type: "message",
    };

    sendMessage(JSON.stringify(messageData));
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  const handleTyping = () => {
    sendMessage(JSON.stringify({ sender: username, type: "typing" }));
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    setAudioChunks([]);
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

  const handleFileSend = () => {
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);

    const fileMessage = {
      sender: username,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      time: new Date().toLocaleTimeString(),
      type: "file",
    };

    sendMessage(JSON.stringify(fileMessage));
    setMessages((prev) => [...prev, fileMessage]);
    setFile(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  return (
    <div className={`chat-container ${darkMode ? "dark" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <div className="chat-header">
        <h2><FaUsers /> Chat App</h2>
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
              msg.type === "join" || msg.type === "leave" ? (
                <div key={i} className="join-message">
                  <em style={{ textAlign: "center", display: "block", color: darkMode ? "#bbb" : "#555" }}>{msg.text}</em>
                </div>
              ) : (
                <div key={i} className={`message ${msg.sender === username ? "sent" : "received"}`}>
                  <strong style={{ color: darkMode ? "#eee" : "#000" }}>{msg.sender}: </strong>
                  {msg.text && <span style={{ color: darkMode ? "#fff" : "#000" }}>{msg.text}</span>}
                  {msg.audioUrl && (
                    <audio controls src={msg.audioUrl} className="audio-bubble" />
                  )}
                  {msg.fileUrl && msg.fileType?.startsWith("image") ? (
                    <img src={msg.fileUrl} alt="Shared" className="shared-image" />
                  ) : msg.fileUrl ? (
                    <a href={msg.fileUrl} download={msg.fileName} className="file-link">📎 {msg.fileName}</a>
                  ) : null}
                  <small style={{ color: darkMode ? "#aaa" : "#555" }}>{msg.time}</small>
                </div>
              )
            ))}
            <div ref={messagesEndRef} />
            {isTyping && <p className="typing-indicator">Someone is typing...</p>}
          </div>

          <div className="input-area">
            <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><FaSmile /></button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <EmojiPicker
  onEmojiClick={(emojiObject: EmojiClickData) => setInput((prev) => prev + emojiObject.emoji)}
/>
              </div>
            )}
            <label className="file-label">
              <FaPaperclip />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
            </label>
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
            {file && <span className="file-preview">📎 {file.name}</span>}
            {isRecording && <span className="recording-label">🎙️ Recording...</span>}
            <button
              onClick={handleSend}
              className={`send-btn ${file || isRecording ? "glow" : ""}`}
            >
              <FaPaperPlane />
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="record-btn"
            >
              <FaMicrophone />
            </button>
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
