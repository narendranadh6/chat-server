import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
    id: string; // Unique message ID
    sender: string;
    text: string;
    time: string;
}

const Chat: React.FC = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // ✅ Prevent duplicate messages
    useEffect(() => {
        if (lastMessage !== null) {
            const receivedData: ChatMessage = JSON.parse(lastMessage.data);

            // Avoid adding the same message multiple times
            setMessages((prev) => {
                if (prev.some((msg) => msg.id === receivedData.id)) return prev;
                return [...prev, receivedData];
            });
        }
    }, [lastMessage]);

    // ✅ Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleJoinChat = () => {
        if (input.trim() !== "") {
            setUsername(input);
            setShowPopup(true);

            setTimeout(() => {
                setShowPopup(false);
            }, 3000);
        }
    };

    const handleSend = () => {
        if (input.trim() === "" || username.trim() === "") return;

        const messageData = {
            id: Date.now().toString(), // Unique ID for each message
            sender: username,
            text: input,
            time: new Date().toLocaleTimeString(),
        };

        sendMessage(JSON.stringify(messageData));
        setMessages((prev) => [...prev, messageData]); // Add message only once
        setInput("");
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💬 Real-Time Chat</h2>

            {/* ✅ Show popup when user joins */}
            {showPopup && <div style={styles.popup}>✅ Joined as <b>{username}</b></div>}

            {!username ? (
                <div style={styles.usernameContainer}>
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleJoinChat} style={styles.sendButton}>
                        Join Chat
                    </button>
                </div>
            ) : (
                <>
                    <div style={styles.chatBox}>
                        {messages.map((msg, i) => (
                            <div key={msg.id} style={msg.sender === username ? styles.myMessage : styles.otherMessage}>
                                {/* ✅ Show sender's name only for other users */}
                                {msg.sender !== username && <strong>{msg.sender}: </strong>}
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
                </>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: "50%",
        margin: "auto",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        backgroundColor: "#f4f4f4",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    },
    title: {
        color: "#333",
    },
    popup: {
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#4CAF50",
        color: "white",
        padding: "10px 20px",
        borderRadius: "5px",
        fontWeight: "bold",
        boxShadow: "0px 2px 5px rgba(0,0,0,0.3)",
    },
    usernameContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        marginBottom: "15px",
    },
    chatBox: {
        height: "300px",
        overflowY: "auto",
        backgroundColor: "#fff",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "inset 0px 2px 5px rgba(0,0,0,0.1)",
    },
    myMessage: {
        backgroundColor: "#dcf8c6",
        padding: "8px",
        borderRadius: "10px",
        textAlign: "right",
        marginBottom: "5px",
        width: "fit-content",
        alignSelf: "flex-end",
        maxWidth: "80%",
        marginLeft: "auto",
    },
    otherMessage: {
        backgroundColor: "#e6e6e6",
        padding: "8px",
        borderRadius: "10px",
        textAlign: "left",
        marginBottom: "5px",
        width: "fit-content",
        alignSelf: "flex-start",
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
