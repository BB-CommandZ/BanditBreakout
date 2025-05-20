import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import Game from './areas/Types/Game';
import Player from './areas/Types/Player';
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
  },
  pingInterval: 10000, // Send ping every 10 seconds
  pingTimeout: 5000    // Disconnect if no pong received within 5 seconds
});

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

  // Handle lobby hosting
  socket.on('hostLobby', async () => {
    try {
      let gameId = uuidv4().replace(/-/g, '').substring(0, 6).toLowerCase();
      if (!activeGames[gameId]) {
        activeGames[gameId] = new Game(gameId);
        const game = activeGames[gameId];
        game.addPlayer();
        console.log(`Player 1 added!`);
        socket.join(gameId);
        const playerId = 1;
        socket.emit('gameId', { gameId, playerId });
        // Update mappings for the new connection
        socketToPlayerMap[socket.id] = { gameId, playerId: 1 };
        playerToSocketMap[1] = socket.id;
      } else {
        console.log(`Game with ID ${gameId} already exists.`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to create game', details: error || 'Unknown error' });
      console.error('Error creating game:', error);
    }
  });

  // Handle character selection
  socket.on('selectCharacter', (gameId: string, playerId: number, characterId: number) => {
    if (activeGames[gameId]) {
      const player = activeGames[gameId].players.find(p => p.id === playerId);
      if (player) {
        player.character_id = characterId;
        console.log(`Player ${playerId} selected character ${characterId} in game ${gameId}`);
        io.to(gameId).emit('characterSelected', { playerId, characterId });
      } else {
        socket.emit('error', { message: 'Player not found in game' });
      }
    } else {
      socket.emit('error', { message: 'Game does not exist' });
    }
  });

  // Handle lobby joining
  socket.on('joinLobby', async (gameId) => {
    gameId = gameId.toLowerCase();
    try {
      if (activeGames[gameId]) {
        const game = activeGames[gameId];
        const playerId = game.players.length + 1;
        game.addPlayer();
        console.log(`Player ${playerId} added!`);
        socket.join(gameId);
        socket.emit('joinedLobby', { gameId, playerId });
        io.to(gameId).emit('playerJoined', { playerId });
        io.to(gameId).emit('gameState', serializeGame(game));
        // Update mappings for the new connection
        socketToPlayerMap[socket.id] = { gameId, playerId };
        playerToSocketMap[playerId] = socket.id;
      } else {
        socket.emit('error', { message: 'Game does not exist' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game', details: error || 'Unknown error' });
      console.error('Error joining game:', error);
    }
  });

  // Handle game start from lobby


  socket.on('startGame', async (gameId) => {
        try {
          if (activeGames[gameId]) {
            const game = activeGames[gameId];
            const playerCount = game.players.length;
            // socket.emit('createGame', gameId, playerCount)

            console.log(`Attempting to create game with ID: ${gameId}, Player Count: ${playerCount}`);
      
            activeGames[gameId].startGame();
        
            socket.join(gameId);
            socket.emit('gameCreated', { gameId });
            // Send the freshly-built game state to everyone already in the room (just the host for now)
            io.to(gameId).emit('gameState', serializeGame(activeGames[gameId]));
            console.log(`Game created: ${gameId}`);



            // io.to(gameId).emit('gameStarted', { gameId });
            const turnOrder = game.determineTurnOrder();
            const currentPlayer = game.getCurrentPlayerTurn();
            io.to(gameId).emit('gameStarted', { gameId, turnOrder, currentPlayer });
            console.log(`gameStarted: ${gameId}, ${currentPlayer}`);
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to start game', details: error || 'Unknown error' });
          console.error('Error starting game:', error);
        }
  })

  // socket.on('startGameDemo', async (gameId) => {
  //   try {
  //     if (activeGames[gameId]) {
  //       const game = activeGames[gameId];
  //       const playerCount = game.players.length;
  //       game.startGame(playerCount, gameId);
  //       io.to(gameId).emit('gameStarted', { gameId });
  //       const turnOrder = game.determineTurnOrder();
  //       const currentPlayer = game.getCurrentPlayerTurn();
  //       io.to(gameId).emit('gameStarted', { turnOrder, currentPlayer });
  //       console.log(`Game ${gameId} started with turn order: ${turnOrder}, first player: ${currentPlayer}`);
  //     }
  //   } catch (error) {
  //     socket.emit('error', { message: 'Failed to start game', details: error || 'Unknown error' });
  //     console.error('Error starting game:', error);
  //   }
  // });

  // Handle game creation
  socket.on('createGame', async (gameId: string, name: string, playerCount: number) => {
    try {
      // Database operation removed: const newGame = await createGame(gameId, name);
      console.log(`Attempting to create game with ID: ${gameId}, Name: ${name}, Player Count: ${playerCount}`);
      
      // Create a new game if it doesn't exist in activeGames
      if (!activeGames[gameId]) {
        activeGames[gameId] = new Game(gameId);
        console.log(`Created new game with ID: ${gameId} as it did not exist.`);
      }
      
      activeGames[gameId].startGame();
        
      socket.join(gameId);
      socket.emit('gameCreated', { gameId });
      // Send the freshly-built game state to everyone already in the room (just the host for now)
      io.to(gameId).emit('gameState', serializeGame(activeGames[gameId]));
      console.log(`Game created: ${gameId}`);
    } catch (error: any) {
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
          await tile.event.onStep(playerId, activeGames[gameId]);
          await emitTileTrigger(gameId, playerId, tile.event.type);
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
          await tile.event.onStep(playerId, activeGames[gameId]);
          await emitTileTrigger(gameId, playerId, tile.event.type);
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

        //Just in case lost current player turn and avoid deadlock
        io.to(gameId).emit('turnAdvanced', { currentPlayer: currentPlayer });

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
        } else {
              // const game = activeGames[gameId];

              // if (game.players.length === 1) {
              //   console.log(`Single player ${playerId} moving`);
              // }
              // const nextPlayer = game.players.length === 1 ? playerId : game.advanceTurn();
              // io.to(gameId).emit('turnAdvanced', { currentPlayer: nextPlayer });
              // console.log(`Turn advanced to player ${nextPlayer} after move completion in game ${gameId}`);
        }
        

        console.log(`Player ${playerId} moved by dice roll of ${result.roll} to position ${newPosition} in game ${gameId}`);
        // Check for tile event
        const tile = activeGames[gameId].map.tiles[newPosition];
        if (tile.event.type !== 0) {
          await tile.event.onStep(playerId, activeGames[gameId]);
          await emitTileTrigger(gameId, playerId, tile.event.type);
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

  const emitTileTrigger = async (gameId: string, playerId: number, eventType: number) => {
    io.to(gameId).emit('tileEventTriggered', { playerId, eventType, gameId });

    // EVENTS 178
    const player = activeGames[gameId].players.find(p => p.id === playerId);
    if (activeGames[gameId] && player) {
      
      if (eventType === 7 || eventType === 8 || eventType === 1) {
      try {
          const gold = player.getGold ? player.getGold() : (player.status?.gold ?? 0);
          io.to(gameId).emit('statusChange', {gameId, playerId, resource: 'gold', value: gold });
          console.log(`statusChange emitted for player ${playerId} (eventType ${eventType}) with gold: ${gold}`);
        
      } catch (error) {
        socket.emit('error', { message: 'Failed to emit tile event' });
        console.error('Error emitting tile event:', error);
      }
    }

      if (eventType === 4) {
        try {
          const latestItem = player.inventory.items[player.inventory.items.length - 1];
          io.to(gameId).emit('statusChange', {gameId, playerId, resource: 'item', value: latestItem?.id });
          console.log(`statusChange emitted for player ${playerId} (eventType ${eventType}) with item: ${latestItem?.id}`);
        }
        catch (error) {
          socket.emit('error', { message: 'Failed to emit tile event' });
          console.error('Error emitting tile event:', error);
        }
      }
    }
    }

  // Handle game start request (from host)
  // socket.on('startGameFromHost', async (gameId: string) => {
  //   if (!activeGames[gameId]) {
  //     socket.emit('error', { message: 'Game does not exist' });
  //     return;
  //   }
  //   try {
  //     const turnOrder = activeGames[gameId].determineTurnOrder();
  //     const currentPlayer = activeGames[gameId].getCurrentPlayerTurn();
  //     io.to(gameId).emit('gameStarted', { turnOrder, currentPlayer });
  //     console.log(`Game ${gameId} started with turn order: ${turnOrder}, first player: ${currentPlayer}`);
  //   } catch (error) {
  //     socket.emit('error', { message: 'Failed to start game' });
  //     console.error('Error starting game:', error);
  //   }
  // });

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
      // Automatically advance turn or keep it with the player in single-player mode

      // if (game.players.length === 1) {
      //   console.log(`Single player ${playerId} moving`);
      // }
      // const nextPlayer = game.players.length === 1 ? playerId : game.advanceTurn();
      // io.to(gameId).emit('turnAdvanced', { currentPlayer: nextPlayer });
      // console.log(`Turn advanced to player ${nextPlayer} after move completion in game ${gameId}`);
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
  'battle_screen/background.png', // Added battle result assets
  'battle_screen/defeat.svg',
  'battle_screen/victory.svg',

  'battle_scene/battle-bg.png', 
  'battle_scene/health bar.svg',
  'battle_scene/health bar.svg',
  'battle_scene/backing-green.png',
  'battle_scene/backing-green.png',
  'battle_scene/banner.svg',
  'battle_scene/banner.svg',
  'battle_scene/buckshot-back.svg',
  'battle_scene/wim-front.svg',
  'battle_scene/health backing.svg',
  'battle_scene/health backing.svg',

  'gui/coin_icon.png',
  'gui/backing.svg',
  'gui/banner.svg',
  'gui/board.svg',
  'gui/frame.svg',
  
  'lasso/lasso zoom.svg',
  'shovel/shovel zoom.svg',
  'cowboy_vest/vest zoom.svg',
  'poison_crossbow/crossbow zoom.svg',
  'mirage_teleporter/teleporter zoom.svg',
  'cursed_coffin/Coffin zoom.svg',
  'rigged_dice/dice zoom.svg',
  'v.s./vs zoom.svg',
  'tumbleweed/tumbleweed zoom.svg',
  'magic_carpet/carpet zoom.svg',
   'wind_staff/staff zoom.svg',
        
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
  
  // Periodically synchronize game state for all active games
  setInterval(() => {
    Object.keys(activeGames).forEach(gameId => {
      const game = activeGames[gameId];
      if (game) {
        io.to(gameId).emit('gameState', serializeGame(game));
        console.log(`Periodic game state sync sent for game ${gameId}`);
      }
    });
  }, 10000); // Sync every 10 seconds
});

// Database connection removed for testing purposes
// Connect to MongoDB
// connectToDatabase().catch(err => {
//   console.error('Failed to connect to database:', err);
// });
