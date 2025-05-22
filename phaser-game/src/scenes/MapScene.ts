import { Socket } from "socket.io-client";
import { SocketService } from "../services/SocketService";

export class MapScene extends Phaser.Scene {
  constructor() {
    super("MapScene");

    this.playerId = 1;
  }

  // private player: Phaser.GameObjects.Image;
  private tileLocations: Map<number, { cx: number; cy: number; r: number }> =
    new Map();
  private socket: any; // Socket.io client
  //TODO
  //private gameId: string = 'game_' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // Generate a random game ID
  private gameId: string = "game_multiple_user";
  private playerId: number;
  private characterAsset: string = "character_asset/solsticeFront.svg"; // Default character
  private turnOrder: number[] = [];
  private currentPlayerTurn: number = -1;
  private playerInitialRolls: Map<number, number> = new Map();
  private playerToCharacterMap: Map<number, number> = new Map(); // Mapping of player ID to character ID
  private playerSprites: Map<number, Phaser.GameObjects.Image> = new Map();
  private diceVideos: Map<string, Phaser.GameObjects.Video> = new Map();

  // Initialize with data passed from another scene
  async init(
    data: {
      gameId?: string;
      playerId?: number;
      characterAsset?: string;
      currentPlayerTurn?: number;
    } = {}
  ) {
    if (data.gameId) {
      this.gameId = data.gameId; // Set gameId from passed data
      console.log(`Using gameId from data: ${this.gameId}`);
    } else {
      console.log(`No gameId provided, using default: ${this.gameId}`);
    }

    if (data.characterAsset) {
      this.characterAsset = data.characterAsset;
      console.log(`Using character asset from data: ${this.characterAsset}`);
    }

    if (data.playerId !== undefined) {
      this.playerId = data.playerId; // Set currentPlayer from passed data
      console.log(`Using playerId from data: ${this.playerId}`);
    } else {
      console.log(`No playerId provided, using default: ${this.playerId}`);
    }

    if (data.currentPlayerTurn !== undefined) {
      this.currentPlayerTurn = data.currentPlayerTurn; // Set currentPlayer from passed data
      console.log(
        `Using currentPlayerTurn from data: ${this.currentPlayerTurn}`
      );
    } else {
      console.log(
        `No currentPlayer provided, using default: ${this.currentPlayerTurn}`
      );
    }

    // Initialize socket connection
    this.initializeSocket();

    // Setup socket listeners for multiplayer functionality
    this.setupSocketListeners();
  }

  preload() {
    const serverUrl =
      import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    this.load.setBaseURL(serverUrl);
    this.load.setPath("assets");

    // Access the passed data directly in preload
    const data = this.scene.settings.data as any;

    if (data && data.characterAsset) {
      this.characterAsset = data.characterAsset;
      console.warn(
        `Set character asset from scene data in preload: ${this.characterAsset}`
      );
    } else {
      console.warn(
        "No character asset provided in preload, using default:",
        this.characterAsset
      );
    }

    this.load.image(
      "backgroundMap",
      encodeURIComponent("board/background.png")
    );

    // Load the appropriate map overlay based on environment variable
    const useNumberedMap = import.meta.env.VITE_USE_NUMBERED_MAP === "true";
    const mapFile = useNumberedMap
      ? "board/BoardWithBridgesNumbered.svg"
      : "board/Board with Bridges.svg";
    this.load.svg("mapOverlay", encodeURIComponent(mapFile), {
      width: 1920,
      height: 1080,
    });

    // Dynamically load the player sprite based on the selected character
    this.load.svg("player", encodeURIComponent(this.characterAsset), {
      width: 64,
      height: 64,
    });

    // Load the tile locations CSV file
    this.load.text(
      "tileLocations",
      encodeURIComponent("board/tilesLocation.csv")
    );

    this.load.svg(
      "buckshot-1",
      encodeURIComponent("character_asset/buckshotFront.svg"),
      { width: 64, height: 64 }
    );
    this.load.svg(
      "serpy-1",
      encodeURIComponent("character_asset/serpyFront.svg"),
      { width: 64, height: 64 }
    );
    this.load.svg(
      "grit-1",
      encodeURIComponent("character_asset/gritFront.svg"),
      { width: 64, height: 64 }
    );
    this.load.svg(
      "solstice-1",
      encodeURIComponent("character_asset/solsticeFront.svg"),
      { width: 64, height: 64 }
    );
    this.load.svg(
      "scout-1",
      encodeURIComponent("character_asset/scoutFront.svg"),
      { width: 64, height: 64 }
    );

    // Load the dice videos with error handling
    console.log("Loading dice videos...");
    for (let i = 1; i <= 6; i++) {
      const key = `dice${i}`;
      this.load.video(key, encodeURIComponent(`dice/dice${i}.mp4`), true);
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
    console.log("Using gameId:", this.gameId);

    const bg = this.add.image(0, 0, "backgroundMap").setOrigin(0);
    const overlay = this.add
      .image(0, 0, "mapOverlay")
      .setOrigin(0)
      .setDisplaySize(bg.width, bg.height);

    // Pre-create sprites for characters 1 to 5
    this.preCreateCharacterSprites();

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
      video.on("complete", () => {
        this.tweens.add({
          targets: video,
          alpha: 0, // Fade to completely transparent
          duration: 1000, // Duration of the fade in milliseconds (1 second)
          ease: "Power1", // Easing function for a smooth fade
          onComplete: () => {
            video.setVisible(false); // Hide the video after fade out
          },
        });
      });
    }

    // Ensure the camera is positioned to show the area where sprites are placed
    this.cameras.main.scrollX = 0;
    this.cameras.main.scrollY = 0;
    console.log(
      "Camera positioned at (0, 0) to ensure visibility of character sprites"
    );

    // Parse the CSV data after it's loaded
    this.parseTileLocations();

    console.log(`${this.playerId}, ${this.currentPlayerTurn}`);
    if (this.playerId === this.currentPlayerTurn) {
      this.showRollDiceButton();
    }
  }

  // Parse the CSV file and store tile locations in a map
  private parseTileLocations() {
    const csvData = this.cache.text.get("tileLocations") as string;
    if (!csvData) {
      console.error("Failed to load tile locations CSV file");
      return;
    }

    const lines = csvData.split("\n");
    // Skip the header line if it exists
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [id, cx, cy, r] = line
          .split(",")
          .map((value) => parseFloat(value));
        if (!isNaN(id) && !isNaN(cx) && !isNaN(cy)) {
          this.tileLocations.set(id, { cx, cy, r });
        }
      }
    }
    console.log("Tile locations loaded:", this.tileLocations);
  }

  // Pre-create character sprites for IDs 1 to 5
  private preCreateCharacterSprites() {
    const characterMap: { [key: number]: string } = {
      1: "buckshot-1",
      2: "serpy-1",
      3: "grit-1",
      4: "solstice-1",
      5: "scout-1",
    };

    const startX = 200; // Starting X position for the first sprite
    const spacing = 100; // Horizontal spacing between sprites
    const yPosition = 200; // Y position for all sprites (near the top of the screen)

    // Use preloaded textures from preload method
    for (let id = 1; id <= 5; id++) {
      const spriteKey = characterMap[id];
      // Check if texture loaded successfully during preload
      if (this.textures.exists(spriteKey)) {
        const xPosition = startX + (id - 1) * spacing;
        // const sprite = this.add.image(xPosition, yPosition, spriteKey).setOrigin(0.5, 0.5);
        const sprite = this.add.image(1683, 991, spriteKey).setOrigin(0.5, 0.5);
        sprite.setDisplaySize(64, 64); // Set the display size to 64x64 pixels
        sprite.setDepth(5); // Default depth for non-local players
        sprite.setVisible(false); // Ensure the sprite is visible
        this.playerSprites.set(id, sprite);
        console.log(
          `Created and displayed sprite for character ID ${id} with key ${spriteKey} at (${xPosition}, ${yPosition})`
        );
      } else {
        console.error(
          `Texture for character ID ${id} (${spriteKey}) failed to load during preload, sprite not created.`
        );
      }
    }

    // Set the local player's sprite with a red tint and pulsing effect
    const localPlayerSprite = this.playerSprites.get(this.playerId);
    if (localPlayerSprite) {
      localPlayerSprite.setTint(0xff0000);
      localPlayerSprite.setDepth(10);
      this.tweens.add({
        targets: localPlayerSprite,
        scaleX: 1.2,
        scaleY: 1.2,
        yoyo: true,
        repeat: -1,
        duration: 1000,
        ease: "Sine.easeInOut",
      });

      console.log(
        `Applied local player effects to sprite for player ID ${this.playerId}`
      );
    } else {
      console.warn(
        `No sprite found for local player ID ${this.playerId}. Effects not applied yet.`
      );
    }
  }

  // Move the player to the specified coordinates or tile number
  movePlayerTo(
    xOrTile: number,
    y?: number,
    playerId: number = this.playerId,
    characterId?: number
  ) {
    // Use characterId if provided, otherwise infer from playerToCharacterMap, fallback to playerId if not found
    const spriteKey =
      characterId || this.playerToCharacterMap.get(playerId) || playerId;
    console.log(
      `characterId: ${characterId}, playerId: ${playerId}, spriteKey: ${spriteKey}`
    );
    let targetSprite = this.playerSprites.get(spriteKey);
    if (!targetSprite) {
      // Map character IDs to preloaded texture keys
      const characterTextureMap: { [key: number]: string } = {
        1: "buckshot-1",
        2: "serpy-1",
        3: "grit-1",
        4: "solstice-1",
        5: "scout-1",
      };
      const textureKey = characterTextureMap[spriteKey] || "solstice-1"; // Default to 'solstice' if not found
      console.log(
        `Creating sprite for character ID ${spriteKey} with texture ${textureKey}`
      );

      if (this.textures.exists(textureKey)) {
        targetSprite = this.add
          .image(1683, 991, textureKey)
          .setOrigin(0.5, 0.5);
        targetSprite.setDisplaySize(64, 64); // Set the display size to 64x64 pixels
        targetSprite.setDepth(playerId === this.playerId ? 10 : 5);
        if (playerId === this.playerId) {
          targetSprite.setTint(0xff0000);
          this.tweens.add({
            targets: targetSprite,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true,
            repeat: -1,
            duration: 1000,
            ease: "Sine.easeInOut",
          });
        }
        targetSprite.setVisible(true);
        this.playerSprites.set(spriteKey, targetSprite);
        console.log(
          `Created sprite for player ${playerId} with character ID ${spriteKey} using texture ${textureKey}`
        );
      } else {
        console.error(
          `Texture ${textureKey} for character ID ${spriteKey} not found, using default 'player'`
        );
        targetSprite = this.add.image(1683, 991, "player").setOrigin(0.5, 0.5);
        targetSprite.setDisplaySize(64, 64); // Set the display size to 64x64 pixels
        targetSprite.setDepth(playerId === this.playerId ? 10 : 5);
        targetSprite.setVisible(true);
        this.playerSprites.set(spriteKey, targetSprite);
      }
    }

    if (y !== undefined) {
      // If y is provided, treat xOrTile as x coordinate
      targetSprite.setVisible(true);
      targetSprite.setPosition(xOrTile, y);
      console.log(`Player ${playerId} moved to (${xOrTile}, ${y})`);
    } else {
      // Treat xOrTile as tile number and look up coordinates
      const tileData = this.tileLocations.get(xOrTile);
      if (tileData) {
        targetSprite.setVisible(true);
        targetSprite.setPosition(tileData.cx, tileData.cy);
        console.log(
          `Player ${playerId} moved to tile ${xOrTile} at (${tileData.cx}, ${tileData.cy})`
        );
      } else {
        console.error(
          `Tile number ${xOrTile} not found in tile locations for player ${playerId}`
        );
      }
    }
  }

  // Play dice roll animation
  playDiceRollAnimation(rollResult: number, onComplete?: () => void) {
    // Hide all dice videos first
    this.diceVideos.forEach((video) => {
      video.setVisible(false);
      video.stop();
    });

    console.log(`rollResult: ${rollResult}`);
    // Select the appropriate video based on rollResult
    let videoKey = "dice3"; // Default to dice6 if rollResult is unknown or 0
    if (rollResult >= 1 && rollResult <= 6) {
      videoKey = `dice${rollResult}`;
    }

    const videoToPlay = this.diceVideos.get(videoKey);
    if (videoToPlay) {
      videoToPlay.setAlpha(1);
      videoToPlay.setVisible(true);
      try {
        videoToPlay.play(false);
        console.log(
          `Playing dice roll animation for result: ${rollResult} using ${videoKey}`
        );
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
    // reuse the singleton socket across all scenes
    this.socket = SocketService.getInstance();
    console.log("Shared socket initialized", this.socket);

    // Handle connection events
    this.socket.on("connect", () => {
      console.log("Connected to server");
      // Create a game first with only one player
      //console.log(`Creating game with ID: ${this.gameId}`);
      //this.socket.emit('createGame', this.gameId, 'Single Player Game', 2);
    });

    // Listen for game creation confirmation before joining
    this.socket.on("gameCreated", (data: { gameId: string }) => {
      console.log(`Game created: ${data.gameId}`);
      // Now join the game after it's created
      //console.log(`Joining game ${this.gameId} as player ${this.playerId}`);
      //this.socket.emit('joinGame', this.gameId, this.playerId);
    });

    this.socket.on("disconnect", (reason: any) => {
      console.log(`Disconnected from server, reason: ${reason}`);
    });

    this.socket.on("error", (error: any) => {
      console.error("Socket error:", error);
    });
  }

  // Setup socket listeners for multiplayer events
  private setupSocketListeners() {
    if (this.socket) {
      // Listen for game state updates
      this.socket.on("gameState", (gameState: any) => {
        console.log("Received game state update:", gameState);

        // Update all player positions based on the game state
        gameState.players.forEach((playerData: any) => {
          const { id, position, status, character_id, pendingMove } =
            playerData;
          console.log(`character_id: ${character_id}`);

          // Update the player to character ID mapping
          this.playerToCharacterMap.set(id, character_id);

          // For the local player, initialize Gui only once and update its status
          if (id === this.playerId) {
            if (!this.guiInitialized) {
              this.initializeGui(character_id);
              this.guiInitialized = true;
            }
            // Send update to Gui scene with latest status
            const guiScene = this.scene.get("Gui");
            if (guiScene && guiScene.scene.isActive()) {
              guiScene.events.emit("updatePlayerStatus", {
                gold: status.gold,
                health: status.health,
                effects: status.effects,
                pendingMove: pendingMove
                  ? { stepsRemaining: pendingMove.stepsRemaining }
                  : null,
              });
            }
          }

          // Move player to the correct position using character_id to get the sprite
          this.movePlayerTo(position, undefined, id, character_id);

          // If this is the local player, ensure the sprite has the red tint and pulsing effect
          if (id === this.playerId) {
            const localSprite = this.playerSprites.get(character_id);
            if (localSprite && localSprite.tintTopLeft !== 0xff0000) {
              // Check if tint is not already applied
              localSprite.setTint(0xff0000);
              localSprite.setDepth(10);
              this.tweens.add({
                targets: localSprite,
                scaleX: 1.2,
                scaleY: 1.2,
                yoyo: true,
                repeat: -1,
                duration: 1000,
                ease: "Sine.easeInOut",
              });
              console.log(
                `Applied local player effects to sprite for character ID ${character_id}`
              );
            }
          }

          // Optionally, update UI elements related to player status (gold, health, effects)
          console.log(
            `Player ${id} status - Gold: ${status.gold}, Health: ${status.health}, Effects: ${status.effects}`
          );
        });

        // Optionally, process tile information if needed for UI updates
        gameState.tiles.forEach((tileData: any) => {
          if (tileData.players.length > 0) {
            console.log(
              `Tile ${tileData.index} has players: ${tileData.players}, event type: ${tileData.eventType}`
            );
          }
        });

        // Check if it's the local player's turn to show or hide the dice roll button
        if (this.currentPlayerTurn === this.playerId) {
          console.log("It's your turn! Roll the dice!");
          this.showRollDiceButton();
        }
      });

      // Listen for player joined event with initial roll
      this.socket.on(
        "playerJoined",
        (data: { playerId: number; initialRoll: number }) => {
          console.log(
            `Player ${data.playerId} joined with initial roll ${data.initialRoll}`
          );
          this.playerInitialRolls.set(data.playerId, data.initialRoll);
        }
      );

      // Listen for player disconnected event
      this.socket.on("playerDisconnected", (data: { playerId: number }) => {
        console.log(`Player ${data.playerId} disconnected`);
        const sprite = this.playerSprites.get(data.playerId);
        if (sprite) {
          sprite.destroy();
          this.playerSprites.delete(data.playerId);
        }
        this.playerInitialRolls.delete(data.playerId);
        this.turnOrder = this.turnOrder.filter((id) => id !== data.playerId);
      });

      // Listen for game started event with turn order
      this.socket.on(
        "gameStarted",
        (data: {
          gameId: string;
          turnOrder: number[];
          currentPlayer: number;
        }) => {
          console.log(`Game started with turn order: ${data.turnOrder}`);
          this.turnOrder = data.turnOrder;
          this.currentPlayerTurn = data.currentPlayer;
          this.updateNextPlayerEffect();
          if (this.currentPlayerTurn === this.playerId) {
            console.log("It's your turn! Roll the dice!");
            this.showRollDiceButton();
          }
        }
      );

      // Listen for turn advanced event
      this.socket.on("turnAdvanced", (data: { currentPlayer: number }) => {
        console.log(`Turn advanced to player ${data.currentPlayer}`);
        this.currentPlayerTurn = data.currentPlayer;
        this.updateNextPlayerEffect();
        if (this.currentPlayerTurn === this.playerId) {
          console.log("It's your turn! Roll the dice!");
          this.showRollDiceButton();
        }
      });

      // Listen for player moved event
      this.socket.on(
        "playerMoved",
        (data: {
          playerId: number;
          position: number;
          roll?: number;
          isPendingMove?: boolean;
        }) => {
          console.log(
            `Player ${data.playerId} moved to position ${data.position}, with roll is ${data.roll}, pending move: ${data.isPendingMove}`
          );
          if (data.roll) {
            console.log(`Dice roll result: ${data.roll}`);
            console.log(`${data.playerId}, ${this.playerId}`);
            if (data.playerId === this.playerId) {
              this.movePlayerTo(data.position, undefined, data.playerId);
              if (!data.isPendingMove) {
                this.endTurn();
              } else {
                console.log(
                  `Turn not ended for player ${data.playerId} due to pending move (e.g., fork).`
                );
              }
              this.playDiceRollAnimation(data.roll, () => {});
            } else {
              this.movePlayerTo(data.position, undefined, data.playerId);
            }
          } else {
            this.movePlayerTo(data.position, undefined, data.playerId);
            if (data.playerId === this.playerId) {
              if (!data.isPendingMove) {
                this.endTurn();
              } else {
                console.log(
                  `Turn not ended for player ${data.playerId} due to pending move (e.g., fork).`
                );
              }
            }
          }
        }
      );

      // Listen for path choice required event
      this.socket.on(
        "pathChoiceRequired",
        (data: {
          playerId: number;
          options: number[];
          stepsRemaining: number;
        }) => {
          if (data.playerId !== this.playerId) return;
          this.showPathChoiceUI(data.options, (chosen) => {
            this.socket.emit("choosePath", this.gameId, this.playerId, chosen);
          });
        }
      );

      // Listen for battle started event (when landing on a battle tile)
      this.socket.on(
        "battleStarted",
        (data: {
          player1: number;
          player2: number;
          result: string;
          player1HP: number;
          player2HP: number;
          winner: number | null;
          turn: number;
        }) => {
          // Start BattleScene
          this.scene.launch("BattleScene", {
            gameId: this.gameId,
            playerId: this.playerId,
            selectedCharacterId: this.playerToCharacterMap.get(this.playerId),
            enemyCharacterId: this.playerToCharacterMap.get(
              data.player1 === this.playerId ? data.player2 : data.player1
            ),
          });
          // Pause current scenes
          this.scene.pause("MapScene");
          this.scene.sleep("Gui");
        }
      );

      // Listen for end of round battle event
      this.socket.on(
        "endOfRoundBattle",
        (data: {
          player1: number;
          player2: number;
          result: string;
          winner: number | null;
          itemTransferred?: number;
          goldTransferred?: number;
          turn: number;
        }) => {
          console.log(
            `End of round battle between Player ${data.player1} and Player ${data.player2}`
          );
          this.showEndOfRoundBattleResultUI(
            data.player1,
            data.player2,
            data.result,
            data.winner,
            data.itemTransferred,
            data.goldTransferred,
            data.turn
          );
        }
      );
    } else {
      console.error("Socket not initialized");
    }
  }

  private guiInitialized: boolean = false;
  private initializeGui(characterId: number) {
    if (!this.guiInitialized) {
      this.scene.launch("Gui", {
        gameId: this.gameId,
        playerId: this.playerId,
        characterId: characterId,
      });
      this.scene.bringToTop("Gui");
      this.guiInitialized = true;
      console.log("Gui scene initialized.");
    } else {
      console.log("Gui already initialized, skipping launch.");
    }
  }

  // Show roll dice button
  private showRollDiceButton() {
    // Get the scene dimensions
    const { width, height } = this.scale;

    // Create a simple button to roll the dice at the bottom-left corner of the scene
    // const button = this.add.text(50, height - 120, 'Roll Dice', {
    //adjusted for testing
    const button = this.add
      .text(500, height - 500, "Roll Dice", {
        fontSize: "32px",
        backgroundColor: "#fff",
        color: "#000",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0, 1) // Set origin to top-left for precise positioning
      .setInteractive()
      .on("pointerdown", () => {
        this.requestDiceRoll();
        button.destroy();
      });
  }

  // Update visual effect for the next player to move
  private updateNextPlayerEffect() {
    this.playerSprites.forEach((sprite, characterId) => {
      this.tweens.killTweensOf(sprite); // Stop any existing tweens for this sprite
      sprite.scaleX = 1; // Reset scale
      sprite.scaleY = 1;

      // Check if this sprite corresponds to the current player's character ID
      // This assumes a mapping or way to know which character ID is used by the current player
      // For simplicity, we apply effects based on whether it's the local player or current turn
      if (characterId === this.playerId) {
        // Local player always has a specific effect
        this.tweens.add({
          targets: sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          yoyo: true,
          repeat: -1,
          duration: 1000,
          ease: "Sine.easeInOut",
        });
      } else if (characterId === this.currentPlayerTurn) {
        // Current turn player (non-local) has a fast pulse
        this.tweens.add({
          targets: sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          yoyo: true,
          repeat: -1,
          duration: 500,
          ease: "Sine.easeInOut",
        });
      } else {
        // Other players have a normal pulse
        this.tweens.add({
          targets: sprite,
          scaleX: 1.1,
          scaleY: 1.1,
          yoyo: true,
          repeat: -1,
          duration: 1000,
          ease: "Sine.easeInOut",
        });
      }
    });
  }

  // Show path choice UI
  private showPathChoiceUI(
    options: number[],
    onSelect: (tile: number) => void
  ) {
    // Create a non-blocking UI for path selection using Phaser elements
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create a semi-transparent background for the modal
    const modal = this.add.rectangle(
      centerX,
      centerY,
      width * 0.6,
      height * 0.4,
      0x000000,
      0.7
    );
    modal.setStrokeStyle(4, 0xffffff);
    modal.setDepth(100);

    // Add a title text
    const title = this.add
      .text(centerX, centerY - height * 0.15, "Choose Your Path", {
        fontSize: "28px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    title.setDepth(101);

    // Add instruction text
    const instruction = this.add
      .text(
        centerX,
        centerY - height * 0.05,
        `Select a tile to move to: ${options.join(", ")}`,
        {
          fontSize: "20px",
          color: "#FFFFFF",
          align: "center",
          wordWrap: { width: width * 0.5 },
        }
      )
      .setOrigin(0.5);
    instruction.setDepth(101);

    // Create buttons for each option
    const buttonSpacing = height * 0.05;
    const startY = centerY + height * 0.05;
    const buttons = options.map((tile, index) => {
      const yPosition = startY + index * buttonSpacing;
      const button = this.add
        .text(centerX, yPosition, `Tile ${tile}`, {
          fontSize: "24px",
          backgroundColor: "#4CAF50",
          color: "#FFFFFF",
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on("pointerdown", () => {
        // Destroy all UI elements when a choice is made
        modal.destroy();
        title.destroy();
        instruction.destroy();
        buttons.forEach((btn) => btn.destroy());
        onSelect(tile);
      });

      button.on("pointerover", () => {
        button.setBackgroundColor("#45a049");
      });

      button.on("pointerout", () => {
        button.setBackgroundColor("#4CAF50");
      });

      button.setDepth(101);
      return button;
    });

    console.log(`Path choice UI displayed for options: ${options.join(", ")}`);
  }

  // Utility to map character IDs to asset paths
  private getCharacterAssetPath(characterId: number): string {
    const characterMap: { [key: number]: string } = {
      1: "character_asset/buckshotFront.svg",
      2: "character_asset/serpyFront.svg",
      3: "character_asset/gritFront.svg",
      4: "character_asset/solsticeFront.svg",
      5: "character_asset/scoutFront.svg",
      // Add other character mappings here
    };
    return characterMap[characterId] || "character_asset/solsticeFront.svg"; // Default to Solstice if ID not found
  }

  // Request to roll dice for movement
  requestDiceRoll() {
    if (this.currentPlayerTurn === this.playerId) {
      console.log("Requesting dice roll for movement");
      // Show dice roll animation immediately to give visual feedback
      // this.playDiceRollAnimation(0); // 0 as a placeholder since we don't know the result yet
      this.socket.emit("movePlayerDiceRoll", this.gameId, this.playerId);
    } else {
      console.log("Cannot roll dice: not your turn");
    }
  }

  // Request to end turn
  endTurn() {
    if (this.currentPlayerTurn === this.playerId) {
      console.log("Ending turn");
      this.socket.emit("endTurn", this.gameId);
    } else {
      console.log("Cannot end turn: not your turn");
    }
  }

  // Show battle result UI when a battle occurs on a tile
  private showBattleResultUI(
    player1: number,
    player2: number,
    result: string,
    player1HP: number,
    player2HP: number,
    winner: number | null,
    turn: number
  ) {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create a modal background for the battle result
    const modal = this.add.rectangle(
      centerX,
      centerY,
      width * 0.6,
      height * 0.4,
      0x000000,
      0.7
    );
    modal.setStrokeStyle(4, 0xffffff);
    modal.setDepth(100);

    // Add battle result text
    const title = this.add
      .text(centerX, centerY - height * 0.15, "Battle Result", {
        fontSize: "28px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    title.setDepth(101);

    // Display battle details
    const details = this.add
      .text(centerX, centerY - height * 0.05, result, {
        fontSize: "18px",
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: width * 0.5 },
      })
      .setOrigin(0.5);
    details.setDepth(101);

    // Add a button to close the modal
    const closeButton = this.add
      .text(centerX, centerY + height * 0.15, "Close", {
        fontSize: "24px",
        backgroundColor: "#4CAF50",
        color: "#FFFFFF",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeButton.on("pointerdown", () => {
      modal.destroy();
      title.destroy();
      details.destroy();
      closeButton.destroy();
    });

    closeButton.on("pointerover", () => {
      closeButton.setBackgroundColor("#45a049");
    });

    closeButton.on("pointerout", () => {
      closeButton.setBackgroundColor("#4CAF50");
    });

    closeButton.setDepth(101);
    console.log(
      `Battle result UI displayed for battle between Player ${player1} and Player ${player2} after ${turn} turns`
    );
  }

  // Show battle result UI for end of round battle
  private showEndOfRoundBattleResultUI(
    player1: number,
    player2: number,
    result: string,
    winner: number | null,
    itemTransferred?: number,
    goldTransferred?: number,
    turn?: number
  ) {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create a modal background for the battle result
    const modal = this.add.rectangle(
      centerX,
      centerY,
      width * 0.6,
      height * 0.4,
      0x000000,
      0.7
    );
    modal.setStrokeStyle(4, 0xffffff);
    modal.setDepth(100);

    // Add battle result text
    const title = this.add
      .text(centerX, centerY - height * 0.15, "End of Round Battle Result", {
        fontSize: "28px",
        color: "#FFFFFF",
      })
      .setOrigin(0.5);
    title.setDepth(101);

    // Display battle details
    const details = this.add
      .text(centerX, centerY - height * 0.05, result, {
        fontSize: "18px",
        color: "#FFFFFF",
        align: "center",
        wordWrap: { width: width * 0.5 },
      })
      .setOrigin(0.5);
    details.setDepth(101);

    // Add a button to close the modal
    const closeButton = this.add
      .text(centerX, centerY + height * 0.15, "Close", {
        fontSize: "24px",
        backgroundColor: "#4CAF50",
        color: "#FFFFFF",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeButton.on("pointerdown", () => {
      modal.destroy();
      title.destroy();
      details.destroy();
      closeButton.destroy();
    });

    closeButton.on("pointerover", () => {
      closeButton.setBackgroundColor("#45a049");
    });

    closeButton.on("pointerout", () => {
      closeButton.setBackgroundColor("#4CAF50");
    });

    closeButton.setDepth(101);
    console.log(
      `End of round battle result UI displayed for battle between Player ${player1} and Player ${player2} after ${turn} turns`
    );
  }

  // For testing purposes, add a method to start the game
  startGame() {
    if (this.socket) {
      console.log(`Starting game ${this.gameId}`);
      // this.socket.emit('startGame', this.gameId);
    } else {
      console.error("Cannot start game: socket not initialized");
    }
  }
}
