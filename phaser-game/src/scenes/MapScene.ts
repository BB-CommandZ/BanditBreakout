import { io, Socket } from 'socket.io-client';

export class MapScene extends Phaser.Scene {
  
    constructor() {
      super("MapScene");
      const storedPlayerId = localStorage.getItem('playerId');
      if (storedPlayerId) {
        this.playerId = parseInt(storedPlayerId, 10);
        console.log(`Using stored playerId: ${this.playerId}`);
      } else {
        this.playerId = Math.floor(Math.random() * 1000) + 1;
        localStorage.setItem('playerId', this.playerId.toString());
        console.log(`Generated new playerId: ${this.playerId}`);
      }
    }

    private player: Phaser.GameObjects.Image;
    private tileLocations: Map<number, { cx: number, cy: number, r: number }> = new Map();
    private socket: any; // Socket.io client
    //TODO
    //private gameId: string = 'game_' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Generate a random game ID
    private gameId: string = 'game_multiple_user'; 
    private playerId: number;
    private characterAsset: string = 'character_asset/solsticeFront.svg'; // Default character
    private turnOrder: number[] = [];
    private currentPlayerTurn: number = -1;
    private playerInitialRolls: Map<number, number> = new Map();
    private playerSprites: Map<number, Phaser.GameObjects.Image> = new Map();
    private diceVideos: Map<string, Phaser.GameObjects.Video> = new Map();

    // test for multiple user
    async init(data: { characterAsset?: string } = {}) {
      if (this.gameId === 'game_multiple_user') {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const { ip } = await res.json();
          this.gameId = ip;
        } catch (err) {
          console.error('IP lookup failed:', err);
        }
      }
      
      if (data.characterAsset) {
        this.characterAsset = data.characterAsset;
        console.log(`Using character asset from data: ${this.characterAsset}`);
      }
    }
  

    preload() {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      this.load.setBaseURL(serverUrl);          
      this.load.setPath('assets');       

      // Access the passed data directly in preload                                                                                                                                             
      const data = this.scene.settings.data as { characterAsset?: string };                                                                                                                     
      if (data && data.characterAsset) {                                                                                                                                                        
        this.characterAsset = data.characterAsset;                                                                                                                                              
        console.warn(`Set character asset from scene data in preload: ${this.characterAsset}`);                                                                                                 
      } else {                                                                                                                                                                                  
        console.warn('No character asset provided in preload, using default:', this.characterAsset);                                                                                            
      }                  
      
      this.load.image('backgroundMap', encodeURIComponent('board/background.png'));   

      //board/BoardWithBridgesNumbered.svg, board/Board with Bridges.svg 
      this.load.svg('mapOverlay', encodeURIComponent('board/BoardWithBridgesNumbered.svg'), {
        width: 1920,
        height: 1080
      });

      // Dynamically load the player sprite based on the selected character
      this.load.svg('player', encodeURIComponent(this.characterAsset), {
        width: 64,
        height: 64
      });

      // Load the tile locations CSV file
      this.load.text('tileLocations', encodeURIComponent('board/tilesLocation.csv'));
      
      // Load the dice videos with error handling
      console.log('Loading dice videos...');
      for (let i = 1; i <= 6; i++) {
        const key = `dice${i}`;
        this.load.video(key, encodeURIComponent(`dice/dice${i}.mp4`), 'loadeddata', false, true);
        this.load.on(`filecomplete-video-${key}`, () => {
          console.log(`Video ${key} loaded successfully`);
        });
        this.load.on(`fileerror-video-${key}`, (error: any) => {
          console.error(`Error loading video ${key}:`, error);
        });
      }
    }
  
    create() {
      // … your existing background + overlay code …
      console.log('Using gameId:', this.gameId);

      const bg = this.add.image(0, 0, 'backgroundMap').setOrigin(0);
      const overlay = this.add.image(0, 0, 'mapOverlay').setOrigin(0).setDisplaySize(bg.width, bg.height);
      this.player = this.add.image(1683, 991, 'player').setOrigin(0.5, 0.5);
      
      // Add pulsing effect
      this.tweens.add({
        targets: this.player,
        scaleX: 1.2,
        scaleY: 1.2,
        yoyo: true, // Makes the tween go back and forth
        repeat: -1, // Repeat indefinitely
        duration: 1000, // Duration of one pulse cycle in milliseconds
        ease: 'Sine.easeInOut' // Smooth easing for the pulse
      });
      
      // Add red tint to the local player
      this.player.setTint(0xFF0000);

      // Set depth to ensure the player sprite is above background and overlay
      this.player.setDepth(10);

      // const mapContainer = this.add.container(0, 0, [bg, overlay, this.player]);
      const mapContainer = this.add.container(0, 0, [bg, overlay]);

      // Add videos for each dice result to the bottom-left corner of the mapContainer
      for (let i = 1; i <= 6; i++) {
        const videoKey = `dice${i}`;
        const video = this.add.video(50, bg.height - 50, videoKey).setOrigin(0.5);
        video.setDisplaySize(64, 64); // Set the display size to 64x64 pixels
        video.setVisible(false); // Start hidden
        mapContainer.add(video);
        this.diceVideos.set(videoKey, video);
        console.log(`Dice video element created for ${videoKey}:`, video);
        
        // Fade out the video after it finishes playing
        video.on('complete', () => {
          this.tweens.add({
            targets: video,
            alpha: 0, // Fade to completely transparent
            duration: 1000, // Duration of the fade in milliseconds (1 second)
            ease: 'Power1', // Easing function for a smooth fade
            onComplete: () => {
              video.setVisible(false); // Hide the video after fade out
            }
          });
        });
      }

      // Parse the CSV data after it's loaded
      this.parseTileLocations();

      // this.movePlayerTo(3);
      
      // Initialize socket connection
      this.initializeSocket();
      
      // Setup socket listeners for multiplayer functionality
      this.setupSocketListeners();
      
      // For testing: Add a button to start the game
      const startButton = this.add.text(100, 200, 'Start Game', { 
        fontSize: '32px', 
        backgroundColor: '#fff', 
        color: '#000', 
        padding: { x: 10, y: 5 }
      })
      .setInteractive()
      .on('pointerdown', () => {
        this.startGame();
        startButton.destroy(); // Remove the button after clicking
      });
    }

    // Parse the CSV file and store tile locations in a map
    private parseTileLocations() {
      const csvData = this.cache.text.get('tileLocations') as string;
      if (!csvData) {
        console.error('Failed to load tile locations CSV file');
        return;
      }

      const lines = csvData.split('\n');
      // Skip the header line if it exists
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [id, cx, cy, r] = line.split(',').map(value => parseFloat(value));
          if (!isNaN(id) && !isNaN(cx) && !isNaN(cy)) {
            this.tileLocations.set(id, { cx, cy, r });
          }
        }
      }
      console.log('Tile locations loaded:', this.tileLocations);
    }

    // Move the player to the specified coordinates or tile number
    movePlayerTo(xOrTile: number, y?: number, playerId: number = this.playerId) {
      let targetSprite = this.playerSprites.get(playerId);
      if (!targetSprite) {
        // Create a sprite for this player if it doesn't exist
        if (playerId === this.playerId) {
          targetSprite = this.player; // Use the pre-created player sprite with tint and pulse
        } else {
          // Create a new sprite for other players without any tint or pulse
          targetSprite = this.add.image(1683, 991, 'player').setOrigin(0.5, 0.5);
          // No tint or effects for other players
        }
        this.playerSprites.set(playerId, targetSprite);
        console.log(`Created sprite for player ${playerId}`);
      }
      
      if (y !== undefined) {
        // If y is provided, treat xOrTile as x coordinate
        targetSprite.setPosition(xOrTile, y);
        console.log(`Player ${playerId} moved to (${xOrTile}, ${y})`);
      } else {
        // Treat xOrTile as tile number and look up coordinates
        const tileData = this.tileLocations.get(xOrTile);
        if (tileData) {
          targetSprite.setPosition(tileData.cx, tileData.cy);
          console.log(`Player ${playerId} moved to tile ${xOrTile} at (${tileData.cx}, ${tileData.cy})`);
        } else {
          console.error(`Tile number ${xOrTile} not found in tile locations for player ${playerId}`);
        }
      }
    }
    
    // Play dice roll animation
    playDiceRollAnimation(rollResult: number, onComplete?: () => void) {
      // Hide all dice videos first
      this.diceVideos.forEach(video => {
        video.setVisible(false);
        video.stop();
      });
      
      console.log(`rollResult: ${rollResult}`);
      // Select the appropriate video based on rollResult
      let videoKey = 'dice3'; // Default to dice6 if rollResult is unknown or 0
      if (rollResult >= 1 && rollResult <= 6) {
        videoKey = `dice${rollResult}`;
      }
      
      const videoToPlay = this.diceVideos.get(videoKey);
      if (videoToPlay) {
        videoToPlay.setAlpha(1);
        videoToPlay.setVisible(true);
        try {
          videoToPlay.play(false);
          console.log(`Playing dice roll animation for result: ${rollResult} using ${videoKey}`);
          // Ensure onComplete is called even if video playback doesn't trigger 'complete' event                                                                                                
          setTimeout(() => {                                                                                                                                                                    
            console.log(`Fallback timeout for video completion: ${videoKey}`);                                                                                                                  
            if (onComplete) onComplete();                                                                                                                                                       
          }, 3000); // Assume video should complete within 3 seconds            
        } catch (error) {
          console.error(`Error playing video ${videoKey}:`, error);
          // Fallback to just completing the action without animation
          if (onComplete) onComplete();
        }
      } else {
        console.error(`Dice video for ${videoKey} not found`);
        if (onComplete) onComplete();
      }
    }
    
    // Initialize socket connection
    private initializeSocket() {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      // Connect to the server
      this.socket = io(serverUrl, {
        autoConnect: true
      });
      console.log('Socket initialized', this.socket);
      
      // Handle connection events
      this.socket.on('connect', () => {
        console.log('Connected to server');
        // Create a game first with only one player
        console.log(`Creating game with ID: ${this.gameId}`);
        this.socket.emit('createGame', this.gameId, 'Single Player Game', 2);
      });
      
      // Listen for game creation confirmation before joining
      this.socket.on('gameCreated', (data: { gameId: string, name: string }) => {
        console.log(`Game created: ${data.gameId} - ${data.name}`);
        // Now join the game after it's created
        console.log(`Joining game ${this.gameId} as player ${this.playerId}`);
        this.socket.emit('joinGame', this.gameId, this.playerId);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log(`Disconnected from server, reason: ${reason}`);
      });
      
      this.socket.on('error', (error: any) => {
        console.error('Socket error:', error);
      });
    }
    
    // Setup socket listeners for multiplayer events
    private setupSocketListeners() {
      if (this.socket) {
        // Listen for game state updates
        this.socket.on('gameState', (gameState: any) => {
          console.log('Received game state update:', gameState);
          
          // Update all player positions based on the game state
          gameState.players.forEach((playerData: any) => {
            const { id, position, status, character_id } = playerData;
            
            // Ensure a sprite exists for this player, but don't recreate if it exists
            if (!this.playerSprites.has(id)) {
              if (id === this.playerId) {
                this.playerSprites.set(id, this.player); // Use the existing tinted and pulsing sprite for local player
              } else {
                // For other players, load their character sprite if character_id is provided
                let spriteKey = 'player'; // Default key
                if (character_id) {
                  const assetPath = this.getCharacterAssetPath(character_id);
                  spriteKey = `player_${id}`; // Unique key for each player
                  this.load.svg(spriteKey, encodeURIComponent(assetPath), { width: 64, height: 64 });
                }
                const newPlayerSprite = this.add.image(1683, 991, spriteKey).setOrigin(0.5, 0.5);
                // No tint for other players
                newPlayerSprite.setDepth(5); // Set depth lower than local player
                this.playerSprites.set(id, newPlayerSprite);
                console.log(`Created sprite for player ${id} with key ${spriteKey}`);
              }
            }
            
            // Move player to the correct position
            this.movePlayerTo(position, undefined, id);
            
            // Optionally, update UI elements related to player status (gold, health, effects)
            console.log(`Player ${id} status - Gold: ${status.gold}, Health: ${status.health}, Effects: ${status.effects}`);
            // TODO: Update UI elements for gold, health, and effects if needed
          });
          
          // Optionally, process tile information if needed for UI updates
          gameState.tiles.forEach((tileData: any) => {
            // TODO: Update tile UI if necessary, e.g., highlight tiles with events or players
            if (tileData.players.length > 0) {
              console.log(`Tile ${tileData.index} has players: ${tileData.players}, event type: ${tileData.eventType}`);
            }
          });
        });
        
        // Listen for player joined event with initial roll
        this.socket.on('playerJoined', (data: { playerId: number, initialRoll: number }) => {
          console.log(`Player ${data.playerId} joined with initial roll ${data.initialRoll}`);
          this.playerInitialRolls.set(data.playerId, data.initialRoll);
          // Update UI to show player and their roll
          // Create sprite for new player if needed, but don't recreate for local player
          if (!this.playerSprites.has(data.playerId)) {
            if (data.playerId === this.playerId) {
              this.playerSprites.set(data.playerId, this.player); // Use the existing tinted and pulsing sprite
            } else {
              const newPlayerSprite = this.add.image(1683, 991, 'player').setOrigin(0.5, 0.5);
              // No tint for other players
              newPlayerSprite.setDepth(5); // Set depth lower than local player
              this.playerSprites.set(data.playerId, newPlayerSprite);
              console.log(`Created sprite for player ${data.playerId}`);
            }
          }
        });
        
        // Listen for player disconnected event
        this.socket.on('playerDisconnected', (data: { playerId: number }) => {
          console.log(`Player ${data.playerId} disconnected`);
          // Remove the player's sprite if it exists
          const sprite = this.playerSprites.get(data.playerId);
          if (sprite) {
            sprite.destroy();
            this.playerSprites.delete(data.playerId);
          }
          // Remove player from turn order and initial rolls
          this.playerInitialRolls.delete(data.playerId);
          this.turnOrder = this.turnOrder.filter(id => id !== data.playerId);
        });
        
        // Listen for game started event with turn order
        this.socket.on('gameStarted', (data: { turnOrder: number[], currentPlayer: number }) => {
          console.log(`Game started with turn order: ${data.turnOrder}`);
          this.turnOrder = data.turnOrder;
          this.currentPlayerTurn = data.currentPlayer;
          // Update UI to show turn order and highlight next player
          this.updateNextPlayerEffect();
          // If it's this player's turn, prompt for actions
          if (this.currentPlayerTurn === this.playerId) {
            console.log("It's your turn! Roll the dice!");
            // Show UI button or prompt to roll dice
            this.showRollDiceButton();
          }
        });
        
        // Listen for turn advanced event
        this.socket.on('turnAdvanced', (data: { currentPlayer: number }) => {
          console.log(`Turn advanced to player ${data.currentPlayer}`);
          this.currentPlayerTurn = data.currentPlayer;
          // Update UI to highlight current player
          this.updateNextPlayerEffect();
          // If it's a single-player game, ensure it's always this player's turn
          if (this.playerSprites.size === 1 && this.currentPlayerTurn !== this.playerId) {
            console.warn("Single-player game, forcing turn back to local player");
            this.currentPlayerTurn = this.playerId;
            this.showRollDiceButton();
          } else if (this.currentPlayerTurn === this.playerId) {
            console.log("It's your turn! Roll the dice!");
            // Show UI button or prompt to roll dice
            this.showRollDiceButton();
          }
        });
        
        // Listen for player moved event
        this.socket.on('playerMoved', (data: { playerId: number, position: number, roll?: number, isPendingMove?: boolean }) => {
          console.log(`Player ${data.playerId} moved to position ${data.position}, with roll is ${data.roll}, pending move: ${data.isPendingMove}`);
          if (data.roll) {
            // If a roll value is provided, play animation (or update if already playing)
            console.log(`Dice roll result: ${data.roll}`);
            console.log(`${data.playerId}, ${this.playerId}`);
            // Move player to new position after animation if it's the local player
            if (data.playerId === this.playerId) {
              this.movePlayerTo(data.position, undefined, data.playerId);
              // Only end turn if there is no pending move (e.g., no fork requiring further input)
                if (!data.isPendingMove) {
                  this.endTurn();
                } else {
                  console.log(`Turn not ended for player ${data.playerId} due to pending move (e.g., fork).`);
                }
                
              this.playDiceRollAnimation(data.roll, () => {
                
              });
            } else {
              this.movePlayerTo(data.position, undefined, data.playerId);
            }
          } else {
            this.movePlayerTo(data.position, undefined, data.playerId);
          }
        });

        this.socket.on('pathChoiceRequired', (data: { playerId: number; options: number[]; stepsRemaining: number }) => {
          if (data.playerId !== this.playerId) return;
          this.showPathChoiceUI(data.options, (chosen) => {
            this.socket.emit('choosePath', this.gameId, this.playerId, chosen);
          });
        });
      } else {
        console.error('Socket not initialized');
      }
    }
    
    // Show roll dice button
    private showRollDiceButton() {
      // Get the scene dimensions
      const { width, height } = this.scale;
      
      // Create a simple button to roll the dice at the bottom-left corner of the scene
      const button = this.add.text(50, height - 120, 'Roll Dice', { 
        fontSize: '32px', 
        backgroundColor: '#fff', 
        color: '#000', 
        padding: { x: 10, y: 5 }
      })
      .setOrigin(0, 1) // Set origin to top-left for precise positioning
      .setInteractive()
      .on('pointerdown', () => {
        button.destroy();
        this.requestDiceRoll();
      });
    }
    
    // Update visual effect for the next player to move
    private updateNextPlayerEffect() {
      this.playerSprites.forEach((sprite, playerId) => {
        this.tweens.killTweensOf(sprite); // Stop any existing tweens for this sprite
        sprite.scaleX = 1; // Reset scale
        sprite.scaleY = 1;
        
        if (playerId === this.currentPlayerTurn) {
          // Add fast pulsing effect for the current turn player (if not local player)
          this.tweens.add({
            targets: sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true, // Makes the tween go back and forth
            repeat: -1, // Repeat indefinitely
            duration: 500, // Fast pulse with 0.5 second duration
            ease: 'Sine.easeInOut' // Smooth easing for the pulse
          });
        } else {
          // Add normal pulsing effect for non-turn players (if not local player)
          this.tweens.add({
            targets: sprite,
            scaleX: 1.1,
            scaleY: 1.1,
            yoyo: true, // Makes the tween go back and forth
            repeat: -1, // Repeat indefinitely
            duration: 1000, // Normal pulse with 1 second duration
            ease: 'Sine.easeInOut' // Smooth easing for the pulse
          });
        }
        
      });
    }
    
    // Show path choice UI
    private showPathChoiceUI(options: number[], onSelect: (tile: number) => void) {
      // Create a non-blocking UI for path selection using Phaser elements
      const { width, height } = this.scale;
      const centerX = width / 2;
      const centerY = height / 2;

      // Create a semi-transparent background for the modal
      const modal = this.add.rectangle(centerX, centerY, width * 0.6, height * 0.4, 0x000000, 0.7);
      modal.setStrokeStyle(4, 0xFFFFFF);
      modal.setDepth(100);

      // Add a title text
      const title = this.add.text(centerX, centerY - height * 0.15, 'Choose Your Path', {
        fontSize: '28px',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      title.setDepth(101);

      // Add instruction text
      const instruction = this.add.text(centerX, centerY - height * 0.05, `Select a tile to move to: ${options.join(', ')}`, {
        fontSize: '20px',
        color: '#FFFFFF',
        align: 'center',
        wordWrap: { width: width * 0.5 }
      }).setOrigin(0.5);
      instruction.setDepth(101);

      // Create buttons for each option
      const buttonSpacing = height * 0.05;
      const startY = centerY + height * 0.05;
      const buttons = options.map((tile, index) => {
        const yPosition = startY + index * buttonSpacing;
        const button = this.add.text(centerX, yPosition, `Tile ${tile}`, {
          fontSize: '24px',
          backgroundColor: '#4CAF50',
          color: '#FFFFFF',
          padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        button.on('pointerdown', () => {
          // Destroy all UI elements when a choice is made
          modal.destroy();
          title.destroy();
          instruction.destroy();
          buttons.forEach(btn => btn.destroy());
          onSelect(tile);
        });

        button.on('pointerover', () => {
          button.setBackgroundColor('#45a049');
        });

        button.on('pointerout', () => {
          button.setBackgroundColor('#4CAF50');
        });

        button.setDepth(101);
        return button;
      });

      console.log(`Path choice UI displayed for options: ${options.join(', ')}`);
    }

    // Utility to map character IDs to asset paths
    private getCharacterAssetPath(characterId: number): string {
      const characterMap: { [key: number]: string } = {
        1: 'character_asset/solsticeFront.svg',
        2: 'character_asset/buckshotFront.svg',
        3: 'character_asset/serpyFront.svg',
        4: 'character_asset/gritFront.svg',
        5: 'character_asset/scoutFront.svg'
        // Add other character mappings here
      };
      return characterMap[characterId] || 'character_asset/solsticeFront.svg'; // Default to Solstice if ID not found
    }

    // Request to roll dice for movement
    requestDiceRoll() {
      if (this.currentPlayerTurn === this.playerId) {
        console.log('Requesting dice roll for movement');
        // Show dice roll animation immediately to give visual feedback
        // this.playDiceRollAnimation(0); // 0 as a placeholder since we don't know the result yet
        this.socket.emit('movePlayerDiceRoll', this.gameId, this.playerId);
      } else {
        console.log('Cannot roll dice: not your turn');
      }
    }
    
    // Request to end turn
    endTurn() {
      if (this.currentPlayerTurn === this.playerId) {
        console.log('Ending turn');
        this.socket.emit('endTurn', this.gameId);
      } else {
        console.log('Cannot end turn: not your turn');
      }
    }
    
    // For testing purposes, add a method to start the game
    startGame() {
      if (this.socket) {
        console.log(`Starting game ${this.gameId}`);
        this.socket.emit('startGame', this.gameId);
      } else {
        console.error('Cannot start game: socket not initialized');
      }
    }
  }
  
