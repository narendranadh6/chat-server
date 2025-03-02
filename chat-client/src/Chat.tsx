import React, { useState } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = "wss://chat-server.onrender.com";


const Chat = () => {
    const { sendMessage, lastMessage } = useWebSocket(WS_URL);
    const [messages, setMessages] = useState<string[]>([]);

    React.useEffect(() => {
        if (lastMessage !== null) {
            setMessages((prev) => [...prev, lastMessage.data]);
        }
    }, [lastMessage]);

    return (
        <div>
            <h2>Real-Time Chat</h2>
            <ul>
                {messages.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
            <input type="text" onKeyDown={(e) => {
                if (e.key === "Enter") {
                    sendMessage(e.currentTarget.value);
                    e.currentTarget.value = "";
                }
            }} />
        </div>
    );
};

export default Chat;
