import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
    sender?: string;  // Sender name (undefined if system message)
    text: string;     // Message content
    time: string;     // Timestamp
    type?: "join" | "message"; // ✅ New: Message type (join message or normal chat)
}

const Chat: React.FC = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [isUsernameSet, setIsUsernameSet] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (lastMessage !== null) {
            const receivedData: ChatMessage = JSON.parse(lastMessage.data);

            // Prevent duplicates
            if (!messages.some(msg => msg.text === receivedData.text && msg.sender === receivedData.sender)) {
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
            setInput(""); // ✅ Clear input after setting username
            setIsUsernameSet(true);

            // ✅ Notify others that a new user has joined
            const joinMessage: ChatMessage = {
                text: `${input} joined the chat`,
                time: new Date().toLocaleTimeString(),
                type: "join", // ✅ New type to differentiate
            };
            sendMessage(JSON.stringify(joinMessage));
            setMessages((prev) => [...prev, joinMessage]);
        }
    };

    const handleSend = () => {
        if (input.trim() === "" || username.trim() === "") return;
        
        const messageData: ChatMessage = {
            sender: username,
            text: input,
            time: new Date().toLocaleTimeString(),
            type: "message",
        };

        sendMessage(JSON.stringify(messageData));

        setMessages([...messages, messageData]);
        setInput("");
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💬 Real-Time Chat</h2>

            {/* ✅ New Header: "You joined as {username}" */}
            {isUsernameSet && (
                <div style={styles.userHeader}>
                    <b>You joined as:</b> {username}
                </div>
            )}

            {!isUsernameSet ? (
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
                            msg.type === "join" ? (
                                // ✅ Display a system message when someone joins
                                <div key={i} style={styles.joinMessage}>
                                    {msg.text}
                                    <small style={styles.timestamp}>{msg.time}</small>
                                </div>
                            ) : (
                                <div key={i} style={msg.sender === username ? styles.myMessage : styles.otherMessage}>
                                    <strong>{msg.sender}</strong>: <span>{msg.text}</span>
                                    <small style={styles.timestamp}>{msg.time}</small>
                                </div>
                            )
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
        textAlign: "center" as "center",
        backgroundColor: "#f4f4f4",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    },
    title: {
        color: "#333",
    },
    userHeader: {
        backgroundColor: "#d1e7fd",
        padding: "8px",
        borderRadius: "5px",
        fontSize: "14px",
        fontWeight: "bold",
        marginBottom: "10px",
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
        textAlign: "right" as "right",
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
        textAlign: "left" as "left",
        marginBottom: "5px",
        width: "fit-content",
        alignSelf: "flex-start",
        maxWidth: "80%",
    },
    joinMessage: {
        textAlign: "center" as "center",
        fontStyle: "italic",
        color: "#555",
        padding: "5px",
        backgroundColor: "#f8f8f8",
        borderRadius: "5px",
        margin: "5px 0",
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
