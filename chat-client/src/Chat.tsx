import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import { FaPaperPlane } from "react-icons/fa6";
import { FaMicrophone } from "react-icons/fa6";


const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
  sender: string;
  text?: string;
  time: string;
  type?: string;
  audioUrl?: string;
}

const Chat: React.FC = () => {
  const { sendMessage, lastMessage } = useWebSocket(WS_URL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (lastMessage !== null) {
      const receivedData: ChatMessage = JSON.parse(lastMessage.data);
      
      // Prevent duplicate join messages
      if (receivedData.type === "join" && !messages.some(msg => msg.sender === receivedData.sender && msg.type === "join")) {
        setMessages((prev) => [...prev, receivedData]);
      }
      
      // Prevent empty messages
      else if (receivedData.text || receivedData.audioUrl) {
        setMessages((prev) => [...prev, receivedData]);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoinChat = () => {
    if (input.trim() !== "") {
      setUsername(input);
      sendMessage(JSON.stringify({ sender: input, text: `${input} joined the chat`, type: "join", time: new Date().toLocaleTimeString() }));
      setInput(""); // Clear input after setting username
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
    setMessages((prev) => [...prev, messageData]);
    setInput("");
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
      setAudioChunks([]); // ✅ Clear chunks after sending
    };
  };

  return (
    <div className="h-screen flex flex-col items-center bg-gray-100 p-4">
      <h2 className="text-2xl font-bold mb-2">💬 Real-Time Chat</h2>
      
      {username && <div className="bg-blue-500 text-white px-4 py-2 rounded mb-2">You joined as <b>{username}</b></div>}
      
      {!username ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter your name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border p-2 rounded"
          />
          <button onClick={handleJoinChat} className="bg-blue-500 text-white px-4 py-2 rounded">Join</button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl bg-white p-4 rounded-lg shadow-md h-96 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`p-2 my-1 rounded-lg max-w-xs ${msg.sender === username ? "bg-green-200 ml-auto" : "bg-gray-200"}`}>
                <strong>{msg.sender}: </strong>
                {msg.text && <span>{msg.text}</span>}
                {msg.audioUrl && <audio controls src={msg.audioUrl} className="mt-1" />}
                <small className="block text-xs text-right">{msg.time}</small>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 mt-2 w-full max-w-2xl">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="border p-2 rounded flex-1"
            />
            <button onClick={handleSend} className="bg-blue-500 text-white p-2 rounded">
            <FaPaperPlane />
            </button>
            <button onClick={startRecording} className="bg-gray-500 text-white p-2 rounded">
            <FaMicrophone />
            </button>

          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
