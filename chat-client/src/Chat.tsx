import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
    sender: string;
    text: string;
    time: string;
    type?: string;
}

const Chat: React.FC = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [activeUsers, setActiveUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (lastMessage !== null) {
            const receivedData: ChatMessage = JSON.parse(lastMessage.data);

            setMessages((prevMessages) => {
                // Prevent duplicate messages
                const isDuplicate = prevMessages.some(
                    (msg) => msg.text === receivedData.text &&
                             msg.sender === receivedData.sender &&
                             msg.time === receivedData.time
                );
                return isDuplicate ? prevMessages : [...prevMessages, receivedData];
            });

            if (receivedData.type === "join") {
                setActiveUsers((prevUsers) => 
                    prevUsers.includes(receivedData.sender) ? prevUsers : [...prevUsers, receivedData.sender]
                );
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
            sendMessage(JSON.stringify({ sender: input, type: "join" }));
            setInput("");  // ✅ Clear input after setting username
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
        setMessages([...messages, messageData]);
        setInput("");  // ✅ Clear input after sending
    };

    const handleTyping = () => {
        sendMessage(JSON.stringify({ sender: username, type: "typing" }));
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💬 Real-Time Chat</h2>

            {username && <div style={styles.userHeader}>You joined as <b>{username}</b></div>}

            {!username ? (
                <div style={styles.usernameContainer}>
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleJoinChat} style={styles.sendButton}>Join Chat</button>
                </div>
            ) : (
                <>
                    <div style={styles.chatBox}>
                        {messages.map((msg, i) => (
                            <div 
                                key={i} 
                                style={msg.type === "system" ? styles.systemMessage : (msg.sender === username ? styles.myMessage : styles.otherMessage)}
                            >
                                {msg.type !== "system" && <strong>{msg.sender}: </strong>} <span>{msg.text}</span>
                                <small style={styles.timestamp}>{msg.time}</small>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {isTyping && <p style={styles.typingIndicator}>Someone is typing...</p>}
                    </div>

                    <div style={styles.inputContainer}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                handleTyping();
                            }}
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
    userHeader: {
        fontSize: "16px",
        fontWeight: "bold",
        padding: "10px",
        backgroundColor: "#e6e6e6",
        borderRadius: "5px",
        marginBottom: "10px",
        display: "inline-block",
    },
    usernameContainer: { // ✅ Added missing style
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
    systemMessage: { // ✅ Added for "User joined" notifications
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
        fontSize: "14px",
        margin: "10px 0",
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
    typingIndicator: {
        fontStyle: "italic",
        color: "#666",
        fontSize: "12px",
        marginTop: "5px",
    },
};

export default Chat;
