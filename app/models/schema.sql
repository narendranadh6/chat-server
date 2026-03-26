-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    text TEXT,
    type VARCHAR(20) DEFAULT 'text',
    metadata JSONB, -- For audioUrl, fileUrl, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for message retrieval by room
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
-- Index for message retrieval by timestamp
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create Room Members table
CREATE TABLE IF NOT EXISTS room_members (
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- Insert Default General Room
INSERT INTO rooms (name, description) 
VALUES ('General', 'Main chat room for everyone')
ON CONFLICT (name) DO NOTHING;

-- Insert AI Assistant User
INSERT INTO users (username, password_hash)
VALUES ('AI_Assistant', 'SYSTEM_ACCOUNT_DO_NOT_LOGIN')
ON CONFLICT (username) DO NOTHING;
