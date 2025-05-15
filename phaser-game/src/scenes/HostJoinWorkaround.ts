import Phaser from "phaser";
import { socket } from "../middleware/socket";


export class HostJoinWorkaround extends Phaser.Scene {
  private socket = socket;
  private playerListText!: Phaser.GameObjects.Text;
  private gameStateText!: Phaser.GameObjects.Text;
  private gameCode!: Phaser.GameObjects.Text;

  constructor() {
    super("HostJoinWorkaround");
  }

  preload() {

    // Listen for server events
    this.socket.on("joinedLobby", (data: { gameId: string; playerId: number }) => {
      this.updateGameState(`Joined Lobby: Game ID = ${data.gameId}, Player ID = ${data.playerId}`);
    });

    this.socket.on("playerJoined", (data: { playerId: number }) => {
      this.updateGameState(`Player Joined: Player ID = ${data.playerId}`);
    });

    this.socket.on("gameState", (gameState) => {
      
    });

    this.socket.on("error", (error) => {
      this.updateGameState(`Error: ${error.message}`);

      });

      this.socket.on("gameStarted", (data: { gameId: string }) => {
        this.scene.start("MapScene", { gameId: data.gameId });
      });
  }

  create() {
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
  
    // Register the 'gameId' listener once
    this.socket.on('gameId', (gameId) => {
      this.updateGameCode(gameId);
      this.updateGameState(`Game ID: ${gameId}`);
    });
  

  this.socket.on('gameState', (gameState) => {
    this.updatePlayerList(gameState.players);
    this.updateGameState(this.formatGameState(gameState));
  });
}


private updateGameCode(gameId: string) {
    this.gameCode.setText(gameId ? `${gameId}` : "Game Code:\n");
  }

  private updateGameState(message: string) {
    this.gameStateText.setText(`Game State:\n${message}`);
  }

  private updatePlayerList(players: any[]) {
    if (!players) {
      this.playerListText.setText("Players:\nNone");
      return;
    }
    let text = "Players:\n";
    players.forEach((p: any) => {
      text += `ID: ${p.id} | Pos: ${p.position} | Gold: ${p.status.gold} | HP: ${p.status.health}\n`;
    });
    this.playerListText.setText(text);
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