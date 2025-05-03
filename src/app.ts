// Import necessary modules
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { connectToDatabase } from './db/mongoose';
import { getRedisClient } from './cache';

const app = express();
const server = http.createServer(app);
// Get Redis client for connection status checking if needed
const redis = getRedisClient();

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Connect to MongoDB
connectToDatabase().catch(err => {
    console.error('Failed to connect to database, server shutting down', err);
    process.exit(1);
});

// Basic route
app.get('/', (req, res) => {
    res.send('Bandit Breakout Server is running!');
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
    
    // Add game-specific socket events here
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await import('./db/mongoose').then(({ disconnectFromDatabase }) => disconnectFromDatabase());
    redis.quit();
    server.close(() => {
        console.log('Server shut down complete');
        process.exit(0);
    });
});
