import { createClient } from "redis";
const pub = createClient();
const sub = createClient();

sub.subscribe("chat");

sub.on("message", (channel, message) => {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
});

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        pub.publish("chat", message);
    });
});
