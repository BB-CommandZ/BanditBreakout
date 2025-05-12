import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import Game from './areas/Types/Game';
import { v4 as uuidv4 } from 'uuid';
import { getAssetByFilename } from './db/operations/assetsOps';
import { MongoClient, GridFSBucket } from 'mongodb';
// Database imports removed for testing purposes
// import { connectToDatabase } from './db/mongoose';
// import { createGame, addPlayerToGame } from './db/operations/gameOps';
// import { createPlayer, updatePlayerPosition, updatePlayerStatus } from './db/operations/playerOps';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any origin for now, restrict in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'game_assets';
const GRIDFS_BUCKET = process.env.GRIDFS_BUCKET || 'assets_fs';

// Store active games in memory for quick access
const activeGames: { [key: string]: Game } = {};

// Quick-and-dirty snapshot of everything the client UI needs to render
function serializeGame(game: Game) {
  return {
    players: game.players.map(p => ({
      id: p.id,
      position: game.map.findPlayer(p.id),
      status: {
        gold: p.status.gold,
        health: p.status.health,
        effects: p.status.effects
      }
    })),
    tiles: game.map.tiles.map(t => ({
      index: t.index,
      eventType: t.event.type,
      players: t.playersOnTile
    }))
  };
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);


    socket.on('hostLobby', async () => {
      try {
        let gameId = uuidv4().replace(/-/g, '').substring(0, 6)
        activeGames[gameId] = new Game(gameId);
        const game = activeGames[gameId];
        game.addPlayer()
        socket.join(gameId);
        socket.emit('gameId', gameId);
      } catch (error) {
        socket.emit('error', { message: 'Failed to create game', details: error || 'Unknown error' });
        console.error('Error creating game:', error);
      }
    })

    socket.on('joinLobby', async (gameId) => {
      try {
        if (activeGames[gameId]) {
          const game = activeGames[gameId];
          game.addPlayer();
          socket.join(gameId);
          socket.emit('joinedLobby', { gameId, playerId: game.players.length });
          io.to(gameId).emit('playerJoined', { playerId: game.players.length });
          io.to(gameId).emit('gameState', serializeGame(game));
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join game', details: error || 'Unknown error' });
        console.error('Error joining game:', error);
      }
    })

    socket.on('startGame', async (gameId) => {
      try {
        if (activeGames[gameId]) {
          const game = activeGames[gameId];
          const playerCount = game.players.length;
          socket.emit('createGame', gameId, playerCount)
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to start game', details: error || 'Unknown error' });
        console.error('Error starting game:', error);
      }
})


  // Handle game creation
  socket.on('createGame', async (gameId: string, playerCount: number) => {
    try {
      // Database operation removed: const newGame = await createGame(gameId, name);
      console.log(`Attempting to create game with ID: ${gameId}, Player Count: ${playerCount}`);
      activeGames[gameId].startGame();
      socket.emit('gameCreated', { gameId });
      // Send the freshly-built game state to everyone already in the room (just the host for now)
      io.to(gameId).emit('gameState', serializeGame(activeGames[gameId]));
      console.log(`Game created: ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create game', details: error || 'Unknown error' });
      console.error('Error creating game:', error);
    }
  });

  // Handle player joining
  socket.on('joinGame', async (gameId: string, playerId: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      // Database operations removed: await addPlayerToGame(gameId, playerId);
      socket.join(gameId);
      socket.emit('joinedGame', { gameId, playerId });
      io.to(gameId).emit('playerJoined', { playerId });
      // Give the joining client the current snapshot
      socket.emit('gameState', serializeGame(activeGames[gameId]));
      console.log(`Player ${playerId} joined game ${gameId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game' });
      console.error('Error joining game:', error);
    }
  });

  // Handle player movement to a specific position
  socket.on('movePlayerTo', async (gameId: string, playerId: number, position: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.move.to(position);
        // Database operation removed: await updatePlayerPosition(playerId, position);
        io.to(gameId).emit('playerMoved', { playerId, position });
        console.log(`Player ${playerId} moved to position ${position} in game ${gameId}`);
        // Check for tile event
        const tile = activeGames[gameId].map.tiles[position];
        if (tile.event.type !== 0) { // Assuming 0 is 'NothingEvent'
          tile.event.onStep(playerId, activeGames[gameId]);
          io.to(gameId).emit('tileEventTriggered', { playerId, eventType: tile.event.type });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to move player' });
      console.error('Error moving player:', error);
    }
  });

  // Handle player movement forward by steps
  socket.on('movePlayerFront', async (gameId: string, playerId: number, steps: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.move.front(steps);
        const newPosition = activeGames[gameId].map.findPlayer(playerId);
        // Database operation removed: await updatePlayerPosition(playerId, newPosition);
        io.to(gameId).emit('playerMoved', { playerId, position: newPosition });
        console.log(`Player ${playerId} moved forward ${steps} steps to position ${newPosition} in game ${gameId}`);
        // Check for tile event
        const tile = activeGames[gameId].map.tiles[newPosition];
        if (tile.event.type !== 0) {
          tile.event.onStep(playerId, activeGames[gameId]);
          io.to(gameId).emit('tileEventTriggered', { playerId, eventType: tile.event.type });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to move player' });
      console.error('Error moving player:', error);
    }
  });

  // Handle player movement by dice roll
  socket.on('movePlayerDiceRoll', async (gameId: string, playerId: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.move.diceRoll();
        const newPosition = activeGames[gameId].map.findPlayer(playerId);
        // Database operation removed: await updatePlayerPosition(playerId, newPosition);
        io.to(gameId).emit('playerMoved', { playerId, position: newPosition });
        console.log(`Player ${playerId} moved by dice roll to position ${newPosition} in game ${gameId}`);
        // Check for tile event
        const tile = activeGames[gameId].map.tiles[newPosition];
        if (tile.event.type !== 0) {
          tile.event.onStep(playerId, activeGames[gameId]);
          io.to(gameId).emit('tileEventTriggered', { playerId, eventType: tile.event.type });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to move player' });
      console.error('Error moving player:', error);
    }
  });

  // Handle item obtain
  socket.on('obtainItem', async (gameId: string, playerId: number, itemId: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.inventory.obtain(itemId);
        io.to(gameId).emit('itemObtained', { playerId, itemId });
        console.log(`Player ${playerId} obtained item ${itemId} in game ${gameId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to obtain item' });
      console.error('Error obtaining item:', error);
    }
  });

  // Handle item usage
  socket.on('useItem', async (gameId: string, playerId: number, itemId: number) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.inventory.useItem(itemId);
        io.to(gameId).emit('itemUsed', { playerId, itemId });
        console.log(`Player ${playerId} used item ${itemId} in game ${gameId}`);
        // If item usage affects position (like Tumbleweed), update position
        const newPosition = activeGames[gameId].map.findPlayer(playerId);
        if (newPosition !== -1) {
          // Database operation removed: await updatePlayerPosition(playerId, newPosition);
          io.to(gameId).emit('playerMoved', { playerId, position: newPosition });
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to use item' });
      console.error('Error using item:', error);
    }
  });

  // Handle resource update (gold and health)
  socket.on('updateResource', async (gameId: string, playerId: number, resource: string, action: string) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        let value;
        if (resource === 'gold') {
          value = player.gold(action);
        } else if (resource === 'health') {
          value = player.health(action);
        }
        // Database operation removed: await updatePlayerStatus(playerId, { [resource]: value });
        io.to(gameId).emit('resourceUpdated', { playerId, resource, value });
        console.log(`Player ${playerId} updated ${resource} to ${value} in game ${gameId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update resource' });
      console.error('Error updating resource:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Optionally, handle player disconnection from game
  });
});

app.use('/assets/', async (req, res) => {
  // Add CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  const filename = decodeURIComponent(req.originalUrl.replace('/assets/', ''));
  console.log(`Asset request: ${filename}`);
  try {
    const asset = await getAssetByFilename(filename);
    if (asset) {
      // Set appropriate content type based on asset metadata or filename extension
      // Extract just the filename from the path for extension checking
      const baseFilename = filename.split('/').pop() || filename;
      let contentType = 'application/octet-stream';
      if (baseFilename.toLowerCase().endsWith('.png')) contentType = 'image/png';
      else if (baseFilename.toLowerCase().endsWith('.jpg') || baseFilename.toLowerCase().endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (baseFilename.toLowerCase().endsWith('.gif')) contentType = 'image/gif';
      else if (baseFilename.toLowerCase().endsWith('.svg')) contentType = 'image/svg+xml';
      else if (baseFilename.toLowerCase().endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (baseFilename.toLowerCase().endsWith('.wav')) contentType = 'audio/wav';
      else if (baseFilename.toLowerCase().endsWith('.mp4')) contentType = 'video/mp4';
      else if (baseFilename.toLowerCase().endsWith('.json')) contentType = 'application/json';
      
      res.setHeader('Content-Type', contentType);
      
      // Check if asset.data exists (from regular collection) or if we need to stream from GridFS
      if (asset.data) {

        // Check if asset.data is a Buffer or needs conversion
        let buf;
        if (Buffer.isBuffer(asset.data)) {
          buf = asset.data;
        } else if (typeof asset.data === 'string') {
          buf = Buffer.from(asset.data, 'base64');
        } else {
          console.error('Unexpected asset.data type:', typeof asset.data);
          return res.status(500).send('Error processing asset data');
        }

        // (optional) set length so clients know when the stream ends
        res.setHeader('Content-Length', buf.length);

        return res.send(buf);


      } else {

        // ── Stream large assets directly from GridFS ──
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
        await client.connect();
        const db = client.db(DB_NAME);
        const bucket = new GridFSBucket(db, { bucketName: GRIDFS_BUCKET });

        const downloadStream = bucket.openDownloadStreamByName(filename);

        downloadStream.on('error', (err) => {
          console.error('GridFS stream error:', err);
          if (!res.headersSent) res.status(404).send('Asset not found');
          client.close();
        });

        downloadStream.on('end', () => client.close());

        // Pipe the file contents straight to the HTTP response
        return downloadStream.pipe(res);
      }
    } else {
      res.status(404).send('Asset not found');
    }
  } catch (error) {
    console.error('Error serving asset:', error);
    res.status(500).send('Error retrieving asset');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Database connection removed for testing purposes
// Connect to MongoDB
// connectToDatabase().catch(err => {
//   console.error('Failed to connect to database:', err);
// });
