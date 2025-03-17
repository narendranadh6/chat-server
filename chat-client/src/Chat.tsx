import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

const Chat: React.FC = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<{ text: string; time: string }[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Append new message when received
    useEffect(() => {
        if (lastMessage !== null) {
            setMessages((prev) => [
                ...prev,
                { text: lastMessage.data, time: new Date().toLocaleTimeString() }
            ]);
        }
    }, [lastMessage]);

    // Auto-scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() === "") return;
        sendMessage(input);
        setMessages([...messages, { text: input, time: new Date().toLocaleTimeString() }]);
        setInput("");
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💬 Real-Time Chat</h2>
            <div style={styles.chatBox}>
                {messages.map((msg, i) => (
                    <div key={i} style={styles.message}>
                        <span>{msg.text}</span>
                        <small style={styles.timestamp}>{msg.time}</small>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputContainer}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={styles.input}
                />
                <button onClick={handleSend} style={styles.sendButton}>Send</button>
            </div>
        </div>
    );
};

// ✅ Correctly Typed Styles using `React.CSSProperties`
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: "50%",
        margin: "auto",
        fontFamily: "Arial, sans-serif",
        textAlign: "center" as "center", // Fix for TypeScript
        backgroundColor: "#f4f4f4",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    },
    title: {
        color: "#333",
    },
    chatBox: {
        height: "300px",
        overflowY: "auto",
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "inset 0px 2px 5px rgba(0,0,0,0.1)",
    },
    message: {
        backgroundColor: "#e6e6e6",
        padding: "8px",
        borderRadius: "10px",
        textAlign: "left" as "left", // Fix for TypeScript
        marginBottom: "5px",
        width: "fit-content",
        maxWidth: "80%",
    },
    timestamp: {
        fontSize: "10px",
        marginLeft: "10px",
        color: "#555",
    },
    inputContainer: {
        display: "flex",
        marginTop: "10px",
    },
    input: {
        flex: 1,
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        outline: "none",
    },
    sendButton: {
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        padding: "10px",
        borderRadius: "5px",
        marginLeft: "5px",
        cursor: "pointer",
    },
};

export default Chat;
