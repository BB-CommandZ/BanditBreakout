import Phaser from "phaser";
import { Socket } from 'socket.io-client';
import { SocketService } from '../services/SocketService';


export class HostJoinWorkaround extends Phaser.Scene {
  private socket = SocketService.getInstance();
  private playerListText!: Phaser.GameObjects.Text;
  private gameStateText!: Phaser.GameObjects.Text;
  private gameCode!: Phaser.GameObjects.Text;
  private playerId: number = 0;
  private pendingGameId: string | null = null;
  private pendingPlayerId: number | null = null;
  private selectedCharacterId: number | null = null;
  private selectedCharacterAsset: string | null = null;


  constructor() {
    super("HostJoinWorkaround");
  }

  init(data: { gameId?: string; playerId?: number; selectedCharacterId?: number; selectedCharacterAsset?: string } = {}) {
    if (data.gameId) {
      this.pendingGameId = data.gameId;
    }
    if (data.playerId !== undefined) {
      this.pendingPlayerId = data.playerId;
      this.playerId = data.playerId;
    }
    if (data.selectedCharacterId) {
      this.selectedCharacterId = data.selectedCharacterId;
    }
    if (data.selectedCharacterAsset) {
      this.selectedCharacterAsset = data.selectedCharacterAsset;
    }
    console.log(`Initialized HostJoinWorkaround with data:`, data);
  }

  preload() {

    // Listen for server events
    this.socket.on("joinedLobby", (data: { gameId: string; playerId: number }) => {
      this.updateGameState(`Joined Lobby: Game ID = ${data.gameId}, Player ID = ${data.playerId}`);
      this.playerId = data.playerId;
      this.updateGameCode(data.gameId); // Update the game code display

      // Wait for 1 second to allow game state synchronization
      setTimeout(() => {
        console.log(`Switching to CharacterSelection scene after delay. Game ID: ${data.gameId}, Player ID: ${data.playerId}`);
        this.scene.start("CharacterSelection", { gameId: data.gameId, playerId: data.playerId });
      }, 1000);
    });

    this.socket.on("playerJoined", (data: { playerId: number }) => {
      this.updateGameState(`Player Joined: Player ID = ${data.playerId}`);
    });

    this.socket.on("gameState", (gameState) => {

    });

    this.socket.on("error", (error) => {
      this.updateGameState(`Error: ${error.message}`);
    });

    this.socket.on("gameStarted", (data: { gameId: string, turnOrder: number[], currentPlayer: number }) => {
      console.log(`Game started with turn order: ${data.turnOrder}`);
      console.log(`${this.playerId}, ${data.currentPlayer}`);
      this.scene.start("MapScene", { gameId: data.gameId, playerId: this.playerId, currentPlayerTurn: data.currentPlayer });
    });

    // Handle gameId event, transition to CharacterSelection
    this.socket.on('gameId', (data: { gameId: string, playerId: number }) => {
      this.pendingGameId = data.gameId;
      this.pendingPlayerId = data.playerId;
      this.playerId = data.playerId;
      console.log(`Received gameId: ${data.gameId}, playerId: ${data.playerId}. Switching to CharacterSelection scene.`);
      // Transition to CharacterSelection scene, passing gameId and playerId
      this.scene.start('CharacterSelection', { gameId: data.gameId, playerId: data.playerId });
    });
  }

  create() {
    // To test the BattleResultScene directly, uncomment the line below
    // and change the 'outcome' to 'win' or 'lose'.
    // this.scene.start('BattleResultScene', { outcome: 'lose' });
    // Background
    this.add
      .graphics()
      .fillGradientStyle(0x000000, 0xff0000, 0xffffff, 0x00ffff)
      .fillRect(0, 0, 1920, 1080);

    // Host Button
    const buttonHost = this.add.rectangle(860, 590, 200, 100, 0x000000).setInteractive();
    this.add.text(810, 570, "Host", { fontSize: "32px", color: "#ffffff" });

    buttonHost.on("pointerdown", () => {
      buttonHost.setFillStyle(0x333333); // Change color on click
      this.socket.emit("hostLobby");
    });

    // Join Button
    const buttonJoin = this.add.rectangle(1260, 590, 200, 100, 0x000000).setInteractive();
    this.add.text(1210, 570, "Join", { fontSize: "32px", color: "#ffffff" });

    buttonJoin.on("pointerdown", () => {
      buttonJoin.setFillStyle(0x333333); // Change color on click
      let gameId = prompt("Enter Game ID to Join:") || ""; // Prompt for Game ID
      this.socket.emit("joinLobby", gameId);
    });

    // Start Button
    const buttonStart = this.add.rectangle(1060, 750, 200, 100, 0x000000).setInteractive();
    this.add.text(1010, 730, "Start", { fontSize: "32px", color: "#ffffff" });

    buttonStart.on("pointerdown", () => {
      const gameId = this.gameCode.text.trim();
      if (gameId && gameId !== "Game Code:") {
        this.socket.emit("startGame", gameId);
      } else {
        alert("No Game ID to start!");
      }
    });

    // Player list display
    this.playerListText = this.add.text(100, 100, "Players:\n", {
      fontSize: "24px",
      color: "#ffffff",
    });

    // Game state display
    this.gameStateText = this.add.text(100, 400, "Game State:\n", {
      fontSize: "24px",
      color: "#ffffff",
    });

    // Game code display
    this.gameCode = this.add.text(100, 700, "Game Code:\n", {
      fontSize: "24px",
      color: "#ffffff",
    });

    // Apply pending data if any
    if (this.pendingGameId) {
      this.updateGameCode(this.pendingGameId);
      if (this.pendingPlayerId !== null) {
        this.playerId = this.pendingPlayerId;
        this.updateGameState(`Game ID: ${this.pendingGameId}, Player ID: ${this.pendingPlayerId}`);
      }
      this.pendingGameId = null;
      this.pendingPlayerId = null;
    }

    // Display selected character if returning from CharacterSelection
    if (this.selectedCharacterId) {
      this.updateGameState(`Selected Character ID: ${this.selectedCharacterId}`);
      console.log(`Character selected with asset: ${this.selectedCharacterAsset}`);
    }

    this.socket.on('gameState', (gameState) => {
      if (this.scene.isActive()) {
        this.updatePlayerList(gameState.players);
        this.updateGameState(this.formatGameState(gameState));
      } else {
        console.warn('Received gameState update but scene is not active, skipping UI updates.');
      }
    });
  }


  private updateGameCode(gameId: string) {
    if (!this.gameCode) {
      console.warn('Game code text object is not initialized yet. Update delayed to create().');
      return;
    }
    this.gameCode.setText(gameId ? `${gameId}` : "Game Code:\n");
    this.gameCode.setInteractive();
    this.gameCode.on('pointerdown', () => {
      // Double-click to copy
      const lastClick = this.gameCode.getData('lastClickTime') || 0;
      if (this.time.now - lastClick < 300) { // 300ms for double-click detection
        navigator.clipboard.writeText(gameId)
          .then(() => {
            console.log(`Game code ${gameId} copied to clipboard`);
            // Optional: Visual feedback
            const originalColor = this.gameCode.style.color;
            this.gameCode.setStyle({ color: '#00ff00' });
            this.time.delayedCall(500, () => {
              this.gameCode.setStyle({ color: originalColor });
            }, [], this);
          })
          .catch(err => {
            console.error('Failed to copy game code to clipboard:', err);
          });
      }
      this.gameCode.setData('lastClickTime', this.time.now);
    });
  }

  private updateGameState(message: string) {
    if (!this.gameStateText) {
      console.warn('Game state text object is not initialized yet. Update delayed to create().');
      return;
    }
    this.gameStateText.setText(`Game State:\n${message}`);
  }

  private updatePlayerList(players: any[]) {
    if (!this.playerListText) {
      console.warn('Player list text object is not initialized yet. Update delayed to create().');
      return;
    }
    if (!players) {
      try {
        this.playerListText.setText("Players:\nNone");
      } catch (error) {
        console.error('Error updating player list text:', error);
      }
      return;
    }
    let text = "Players:\n";
    players.forEach((p: any) => {
      text += `ID: ${p.id} | Pos: ${p.position} | Gold: ${p.status.gold} | HP: ${p.status.health}\n`;
    });
    // Only update text if the scene is active and the object is ready
    if (this.scene.isActive()) {
      try {
        this.playerListText.setText(text);
      } catch (error) {
        console.error('Error updating player list text:', error);
      }
    } else {
      console.warn('Scene is not active, skipping player list update.');
    }
  }

  private formatGameState(gameState: any): string {
    if (!gameState) return "No game state.";
    let text = "";
    if (gameState.players) {
      text += "Players:\n";
      gameState.players.forEach((p: any) => {
        text += `  ID: ${p.id}, Pos: ${p.position}, Gold: ${p.status.gold}, HP: ${p.status.health}\n`;
      });
    }
    if (gameState.tiles) {
      text += "\nTiles:\n";
      gameState.tiles.forEach((t: any) => {
        text += `  Tile ${t.index}: Event ${t.eventType}, Players: [${t.players.join(", ")}]\n`;
      });
    }
    return text;
  }
}
