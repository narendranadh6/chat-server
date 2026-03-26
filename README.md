# Scalable Chat Server with AI Assistant

A production-grade, scalable, real-time chat system built with Node.js, Express, WebSockets, Redis, and PostgreSQL. Features an integrated AI assistant powered by OpenAI.

## 🚀 Features

- **Real-time Messaging**: Instant communication across clients.
- **Multi-room Support**: Create and join different chat rooms.
- **Horizontal Scalability**: Redis Pub/Sub ensures messages are distributed across multiple server instances.
- **Persistent History**: Chat history is stored in PostgreSQL and loaded upon joining a room.
- **AI Assistant**: Interact with an AI assistant by mentioning `@ai` in any chat room.
- **Online Presence**: Track online users in real-time.
- **Typing Indicators**: See when others are typing.
- **Health Checks & Reliability**: Includes rate limiting, connection limits, and robust error handling.

## 🏗 Architecture

```mermaid
graph TD
    Client[React Client] <--> WS[WebSocket Server]
    Client <--> API[REST API]
    WS <--> Redis[Redis Pub/Sub]
    WS <--> DB[(PostgreSQL)]
    API <--> DB
    API <--> AI[OpenAI API]
    WS <--> AI
```

## 🛠 Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- Redis
- OpenAI API Key

### Backend Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL=postgres://user:pass@localhost:5432/chatdb
   REDIS_URL=redis://localhost:6379
   OPENAI_API_KEY=your_api_key
   JWT_SECRET=your_secret
   ```
4. Start the server: `npm start`.

### Frontend Setup
1. Navigate to `chat-client`.
2. Install dependencies: `npm install`.
3. Start the React app: `npm start`.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register`: Create a new account.
- `POST /api/auth/login`: Login and receive a JWT.

### Rooms
- `GET /api/rooms`: List all chat rooms.
- `POST /api/rooms`: Create a new chat room.

### AI
- `POST /api/ai/chat`: Direct interaction with AI.
- `POST /api/ai/summarize`: Summarize chat history.

## 🤝 Contributing
Feel free to open issues or submit pull requests.

## 📜 License
MIT