import React, { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server-production-ed2c.up.railway.app";

interface ChatMessage {
    sender: string;
    text?: string;
    time: string;
    type?: string;
    audio?: string;
}

const Chat: React.FC = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [username, setUsername] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (lastMessage !== null) {
            const receivedData: ChatMessage = JSON.parse(lastMessage.data);

            if (receivedData.type === "join") {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: "System", text: `${receivedData.sender} joined the chat`, time: receivedData.time, type: "system" }
                ]);
            } else if (receivedData.type === "typing") {
                if (receivedData.sender !== username) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 2000);
                }
            } else if (receivedData.type === "audio") {
                setMessages((prevMessages) => [...prevMessages, receivedData]);
            } else {
                setMessages((prevMessages) => [...prevMessages, receivedData]);
            }
        }
    }, [lastMessage, username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleJoinChat = () => {
        if (input.trim() !== "") {
            setUsername(input);
            sendMessage(JSON.stringify({ sender: input, type: "join", time: new Date().toLocaleTimeString() }));
            setInput("");
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
        setMessages((prev) => [...prev, messageData]);
        setInput("");
    };

    const handleTyping = () => {
        sendMessage(JSON.stringify({ sender: username, type: "typing" }));
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const audioUrl = URL.createObjectURL(audioBlob);

                const audioMessage: ChatMessage = {
                    sender: username,
                    audio: audioUrl,
                    time: new Date().toLocaleTimeString(),
                    type: "audio",
                };

                sendMessage(JSON.stringify(audioMessage));
                setMessages((prev) => [...prev, audioMessage]);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
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
                                {msg.type === "audio" ? (
                                    <>
                                        <strong>{msg.sender}: </strong>
                                        <audio controls>
                                            <source src={msg.audio} type="audio/webm" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </>
                                ) : (
                                    <>
                                        {msg.type !== "system" && <strong>{msg.sender}: </strong>}
                                        <span>{msg.text}</span>
                                    </>
                                )}
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
                        {!recording ? (
                            <button onClick={startRecording} style={styles.recordButton}>🎙️</button>
                        ) : (
                            <button onClick={stopRecording} style={styles.stopButton}>⏹️</button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { width: "50%", margin: "auto", fontFamily: "Arial, sans-serif", textAlign: "center", backgroundColor: "#f4f4f4", padding: "20px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" },
    title: { color: "#333" },
    userHeader: { fontSize: "16px", fontWeight: "bold", padding: "10px", backgroundColor: "#e6e6e6", borderRadius: "5px", marginBottom: "10px", display: "inline-block" },
    chatBox: { height: "300px", overflowY: "auto", backgroundColor: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "inset 0px 2px 5px rgba(0,0,0,0.1)" },
    systemMessage: { textAlign: "center", color: "#666", fontStyle: "italic", fontSize: "14px", margin: "10px 0" },
    inputContainer: { display: "flex", marginTop: "10px" },
};

export default Chat;
