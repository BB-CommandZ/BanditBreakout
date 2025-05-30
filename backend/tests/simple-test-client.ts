import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';
const socket = io(SOCKET_URL, {
  reconnection: false, // Don't keep trying to reconnect
  timeout: 5000 // Timeout after 5 seconds if can't connect
});

socket.on('connect', () => {
  console.log('Connected to server');
  // Hardcoded test sequence
  socket.emit('createGame', 'TEST_GAME', 'Test Game', 4);
  setTimeout(() => socket.emit('joinGame', 'TEST_GAME', 1), 1000);
  setTimeout(() => socket.emit('movePlayerDiceRoll', 'TEST_GAME', 1), 2000);
  setTimeout(() => socket.emit('obtainItem', 'TEST_GAME', 1, 8), 3000);
  setTimeout(() => socket.emit('useItem', 'TEST_GAME', 1, 8), 4000);
  // Keep connection alive for a bit longer to see all responses
  setTimeout(() => {
    console.log('Test sequence completed, keeping connection open for additional logs...');
  }, 5000);
  setTimeout(() => {
    console.log('Disconnecting now...');
    socket.disconnect();
    process.exit(0); // Ensure the process exits
  }, 7000);
});

// Add connection error handling
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  console.log('Please ensure the server is running on port 3000 before running this test.');
  socket.disconnect();
  process.exit(1);
});

// Log server responses
socket.on('gameCreated', (data) => console.log('Game created:', data));
socket.on('joinedGame', (data) => console.log('Joined game:', data));
socket.on('playerJoined', (data) => console.log('Player joined:', data));
socket.on('playerMoved', (data) => console.log('Player moved:', data));
socket.on('tileEventTriggered', (data) => console.log('Tile event triggered:', data));
socket.on('itemObtained', (data) => console.log('Item obtained:', data));
socket.on('itemUsed', (data) => console.log('Item used:', data));
socket.on('resourceUpdated', (data) => console.log('Resource updated:', data));
socket.on('error', (error) => console.error('Error:', error));

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  process.exit(0); // Ensure the process exits after disconnection
});

// Add a global timeout to prevent hanging
setTimeout(() => {
  console.error('Test client timed out after 10 seconds. Exiting...');
  socket.disconnect();
  process.exit(1);
}, 10000);
