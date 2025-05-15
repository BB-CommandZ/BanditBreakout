import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path'; // Import path module
import cors from 'cors'; // Import cors middleware
import Game from './areas/Types/Game';
import Player from './areas/Types/Player';
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
  },
  pingInterval: 10000, // Send ping every 10 seconds
  pingTimeout: 5000    // Disconnect if no pong received within 5 seconds
});

app.use(cors()); // Enable CORS for all routes

const PORT = process.env.PORT || 3000;
const DB_NAME = process.env.DB_NAME || 'game_assets';
const GRIDFS_BUCKET = process.env.GRIDFS_BUCKET || 'assets_fs';

// Store active games in memory for quick access
const activeGames: { [key: string]: Game } = {};

// Track socket to player mapping and vice versa for cleanup on reconnect
const socketToPlayerMap: { [socketId: string]: { gameId: string, playerId: number } } = {};
const playerToSocketMap: { [playerId: number]: string } = {};

// Quick-and-dirty snapshot of everything the client UI needs to render
function serializeGame(game: Game) {
  return {
    players: game.players.map(p => ({
      id: p.id,
      position: game.map.findPlayer(p.id),
      character_id: p.character_id,
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

  // Handle game creation
  socket.on('createGame', async (gameId: string, name: string, playerCount: number) => {
    try {
      // Database operation removed: const newGame = await createGame(gameId, name);
      console.log(`Attempting to create game with ID: ${gameId}, Name: ${name}, Player Count: ${playerCount}`);
      if (!activeGames[gameId]) {
        activeGames[gameId] = new Game();
        activeGames[gameId].startGame(playerCount, gameId);
        console.log(`Game created: ${gameId}`);
      } else {
        console.log(`Game with ID ${gameId} already exists, not overwriting.`);
      }
      socket.join(gameId);
      socket.emit('gameCreated', { gameId, name });
      // Send the freshly-built game state to everyone already in the room (just the host for now)
      io.to(gameId).emit('gameState', serializeGame(activeGames[gameId]));
    } catch (error: any) { // Explicitly type error as any
      socket.emit('error', { message: 'Failed to create game', details: error.message || 'Unknown error' });
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
      // Check if this player ID is already associated with another socket
      const oldSocketId = playerToSocketMap[playerId];
      if (oldSocketId && oldSocketId !== socket.id) {
        console.log(`Player ${playerId} reconnected, cleaning up old socket ${oldSocketId}`);
        // Clean up the old socket mapping
        delete socketToPlayerMap[oldSocketId];
        delete playerToSocketMap[playerId];
        // Disconnect the old socket if it still exists
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }
      // Update mappings for the new connection
      socketToPlayerMap[socket.id] = { gameId, playerId };
      playerToSocketMap[playerId] = socket.id;
      // Check if player already exists in the game
      let player = activeGames[gameId].players.find(p => p.id === playerId);
      if (!player) {
        // Add the player to the game if not found
        player = new Player(activeGames[gameId], playerId);
        activeGames[gameId].map.setPlayerPos(0, playerId);
        
        activeGames[gameId].players.push(player);
        console.log(`Added new player ${playerId} to game ${gameId}`);
      
        // Roll for turn order when a player joins
        const roll = activeGames[gameId].rollForTurnOrder(playerId);
        //TO DO
        // activeGames[gameId].determineTurnOrder();
        socket.emit('joinedGame', { gameId, playerId, initialRoll: roll });
        io.to(gameId).emit('playerJoined', { playerId, initialRoll: roll });
        // Give the joining client the current snapshot
        socket.emit('gameState', serializeGame(activeGames[gameId]));
        console.log(`Player ${playerId} joined game ${gameId} with initial roll ${roll}`);

      }
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
  socket.on('movePlayerDiceRoll', async (gameId: string, playerId: number, callback: (response: any) => void) => {
    console.log(`Received movePlayerDiceRoll request for game ${gameId}, player ${playerId}`);
    if (!activeGames[gameId]) {
      const errorResponse = { success: false, error: 'Game does not exist' };
      socket.emit('error', { message: 'Game does not exist' });
      if (callback) callback(errorResponse);
      console.log(`Game does not exist: ${gameId}`);
      return;
    }
    try {
      const currentPlayer = activeGames[gameId].getCurrentPlayerTurn();
      console.log(`Current player turn in game ${gameId}: ${currentPlayer}`);
      if (playerId !== currentPlayer) {
        const errorResponse = { success: false, error: 'It is not your turn' };
        socket.emit('error', { message: 'It is not your turn' });
        if (callback) callback(errorResponse);
        console.log(`It is not your turn, player ${playerId}, current turn is for player ${currentPlayer}`);
        return;
      }
      
      const currentPosition = activeGames[gameId].map.findPlayer(playerId);
      console.log(`Player ${playerId} starting position before movement: ${currentPosition}`);
      
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        const result = player.move.diceRoll();
        const newPosition = activeGames[gameId].map.findPlayer(playerId);

        // Always show the first chunk of movement, with a flag if move is pending due to a fork
        io.to(gameId).emit('playerMoved', { 
          playerId, 
          position: newPosition, 
          roll: result.roll, 
          isPendingMove: !!result.pendingChoice 
        });

        // If there’s a fork, pause and ask the client
        if (result.pendingChoice) {
          player.pendingMove = { stepsRemaining: result.pendingChoice.stepsRemaining };
          console.log(`Player ${playerId} encountered fork at tile ${newPosition}, options: ${result.pendingChoice.options}, steps remaining: ${result.pendingChoice.stepsRemaining}`);
          socket.emit('pathChoiceRequired', {
            playerId,
            options: result.pendingChoice.options,
            stepsRemaining: result.pendingChoice.stepsRemaining
          });
          return; // Wait for the client’s response
        }

        console.log(`Player ${playerId} moved by dice roll of ${result.roll} to position ${newPosition} in game ${gameId}`);
        // Check for tile event
        const tile = activeGames[gameId].map.tiles[newPosition];
        if (tile.event.type !== 0) {
          tile.event.onStep(playerId, activeGames[gameId]);
          io.to(gameId).emit('tileEventTriggered', { playerId, eventType: tile.event.type });
          console.log(`Tile event triggered for player ${playerId}: type ${tile.event.type}`);
        }
        if (callback) callback({ success: true, roll: result.roll, position: newPosition });
      } else {
        const errorResponse = { success: false, error: 'Player not found' };
        if (callback) callback(errorResponse);
        console.log(`Player not found: ${playerId} in game ${gameId}`);
      }
    } catch (error) {
      const errorResponse = { success: false, error: 'Failed to move player' };
      socket.emit('error', { message: 'Failed to move player' });
      if (callback) callback(errorResponse);
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

  // Handle game start request (from host)
  socket.on('startGame', async (gameId: string) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const turnOrder = activeGames[gameId].determineTurnOrder();
      const currentPlayer = activeGames[gameId].getCurrentPlayerTurn();
      io.to(gameId).emit('gameStarted', { turnOrder, currentPlayer });
      console.log(`Game ${gameId} started with turn order: ${turnOrder}, first player: ${currentPlayer}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to start game' });
      console.error('Error starting game:', error);
    }
  });

  // Handle end of turn to advance to the next player
  socket.on('endTurn', async (gameId: string) => {
    if (!activeGames[gameId]) {
      socket.emit('error', { message: 'Game does not exist' });
      return;
    }
    try {
      const game = activeGames[gameId];
      let nextPlayer;
      // Special handling for single-player game to always return turn to the same player
      if (game.players.length === 1) {
        nextPlayer = game.players[0].id;
        console.log(`Single-player game ${gameId}, turn remains with player: ${nextPlayer}`);
      } else {
        nextPlayer = game.advanceTurn();
        console.log(`Turn advanced in multiplayer game ${gameId}, next player: ${nextPlayer}`);
      }
      io.to(gameId).emit('turnAdvanced', { currentPlayer: nextPlayer });
    } catch (error) {
      socket.emit('error', { message: 'Failed to advance turn' });
      console.error('Error advancing turn:', error);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // Client picks a branch when `pathChoiceRequired` fires
  socket.on('choosePath', (gameId: string, playerId: number, chosenTile: number) => {
    const game = activeGames[gameId];
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player || !player.pendingMove) return;

    const currentPosition = game.map.findPlayer(playerId);
    console.log(`Player ${playerId} at position ${currentPosition} chose path to tile ${chosenTile} with ${player.pendingMove.stepsRemaining} steps remaining`);

    // First move onto the selected branch
    player.move.to(chosenTile);

    // Finish the remaining steps, honouring *new* forks along the way
    const followUp = player.move.front(player.pendingMove.stepsRemaining - 1);
    const newPos = game.map.findPlayer(playerId);
    console.log(`Player ${playerId} moved to tile ${newPos} after choosing path`);
    io.to(gameId).emit('playerMoved', { 
      playerId, 
      position: newPos, 
      isPendingMove: !!followUp.pendingChoice 
    });

    if (followUp.pendingChoice) {
      player.pendingMove.stepsRemaining = followUp.pendingChoice.stepsRemaining;
      console.log(`Player ${playerId} encountered another fork at tile ${newPos}, options: ${followUp.pendingChoice.options}, steps remaining: ${followUp.pendingChoice.stepsRemaining}`);
      socket.emit('pathChoiceRequired', {
        playerId,
        options: followUp.pendingChoice.options,
        stepsRemaining: followUp.pendingChoice.stepsRemaining
      });
    } else {
      delete player.pendingMove; // finished this move
      console.log(`Player ${playerId} completed movement at tile ${newPos}`);
      // Ensure turn remains with single player after move completion
      if (game.players.length === 1) {
        io.to(gameId).emit('turnAdvanced', { currentPlayer: playerId });
        console.log(`Single-player game ${gameId}, turn remains with player: ${playerId} after move completion`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Check if this socket is associated with a player
    const playerInfo = socketToPlayerMap[socket.id];
    if (playerInfo) {
      const { gameId, playerId } = playerInfo;
      const game = activeGames[gameId];
      if (game) {
        // Remove player from game
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          // Remove player from map positions
          game.map.playerPositions = game.map.playerPositions.filter(pos => pos !== playerId);
          // Notify other players in the game
          io.to(gameId).emit('playerDisconnected', { playerId });
          // Update game state for remaining players
          io.to(gameId).emit('gameState', serializeGame(game));
          console.log(`Player ${playerId} removed from game ${gameId} due to disconnection`);
          
          // If no players left, clean up the game
          if (game.players.length === 0) {
            delete activeGames[gameId];
            console.log(`Game ${gameId} removed as no players are left`);
          } else if (game.getCurrentPlayerTurn() === playerId) {
            // If it was the disconnected player's turn, advance to the next turn
            const nextPlayer = game.advanceTurn();
            io.to(gameId).emit('turnAdvanced', { currentPlayer: nextPlayer });
            console.log(`Turn advanced in game ${gameId} due to player disconnection, next player: ${nextPlayer}`);
          }
        }
      }
      // Clean up the mapping
      delete socketToPlayerMap[socket.id];
    }
  });
});

// Serve static assets from the 'backend/assets' directory at the '/assets' endpoint
app.use('/assets', express.static(path.join(__dirname, '../phaser-game')));

// The rest of your server code remains the same

// List of critical assets to preload (adjust based on your needs)
const criticalAssets = [
  'board/background.png',
  'board/Board with Bridges.svg',
  'board/BoardWithBridgesNumbered.svg',
  'character_selection/backing.png',
  'character_selection/frame.png',
  'character_selection/page.png',
  'character_selection/backSign.png',
  'character_selection/charSign.png',
  'character_asset/buckshotFront.svg',
  'character_asset/serpyFront.svg',
  'character_asset/gritFront.svg',
  'character_asset/scoutFront.svg',
  'character_asset/solsticeFront.svg',
  'board/tilesLocation.csv',
  'dice/dice1.mp4',
  'dice/dice2.mp4',
  'dice/dice3.mp4',
  'dice/dice4.mp4',
  'dice/dice5.mp4',
  'dice/dice6.mp4',
  'background.png', // Added battle result assets
  'defeat.svg',
  'victory.svg'
];

// Function to preload assets into Redis
async function preloadAssets() {
  console.log('Preloading assets into Redis...');
  for (const assetPath of criticalAssets) {
    try {
      const asset = await getAssetByFilename(assetPath);
      if (asset) {
        console.log(`Asset ${assetPath} preloaded and cached in Redis.`);
      } else {
        console.warn(`Asset ${assetPath} not found during preload.`);
      }
    } catch (error) {
      console.error(`Error preloading asset ${assetPath}:`, error);
    }
  }
  console.log('Asset preloading complete.');
}

// Start the server
server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await preloadAssets(); // Preload assets into Redis
});

// Database connection removed for testing purposes
// Connect to MongoDB
// connectToDatabase().catch(err => {
//   console.error('Failed to connect to database:', err);
// });
