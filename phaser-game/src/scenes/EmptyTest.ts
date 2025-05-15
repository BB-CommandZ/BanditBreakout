import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import Player from "../../../backend/areas/Types/Player";

export class EmptyTest extends Phaser.Scene {
  private socket!: Socket;
  private playerListText!: Phaser.GameObjects.Text;
  private gameStateText!: Phaser.GameObjects.Text;
  private gameCode!: Phaser.GameObjects.Text;

  constructor() {
    super("EmptyTest");
  }

  preload() {
    // Connect to the server
    this.socket = io("http://localhost:3000");

    // Listen for server events
    this.socket.on(
      "joinedLobby",
      (data: { gameId: string; playerId: number }) => {
        this.updateGameState(
          `Joined Lobby: Game ID = ${data.gameId}, Player ID = ${data.playerId}`
        );
      }
    );

    this.socket.on("playerJoined", (data: { playerId: number }) => {
      this.updateGameState(`Player Joined: Player ID = ${data.playerId}`);
    });

    this.socket.on("gameState", (gameState) => {
      this.updatePlayerList(gameState.players);
    });

    this.socket.on("error", (error) => {
      this.updateGameState(`Error: ${error.message}`);
    });

    this.socket.on("battleStarted", (data) => {
      console.log("Battle started:", data);
      this.scene.start("BattleTest"); // Transition to the BattleTest scene
    });
  }

  create() {
    // Background
    this.add
      .graphics()
      .fillGradientStyle(0x000000, 0xff0000, 0xffffff, 0x00ffff)
      .fillRect(0, 0, 1920, 1080);

    // Host Button
    const buttonHost = this.add
      .rectangle(860, 590, 200, 100, 0x000000)
      .setInteractive();
    this.add.text(810, 570, "Host", { fontSize: "32px", color: "#ffffff" });

    buttonHost.on("pointerdown", () => {
      buttonHost.setFillStyle(0x333333); // Change color on click
      this.socket.emit("hostLobby");
    });

    // Join Button
    const buttonJoin = this.add
      .rectangle(1260, 590, 200, 100, 0x000000)
      .setInteractive();
    this.add.text(1210, 570, "Join", { fontSize: "32px", color: "#ffffff" });

    buttonJoin.on("pointerdown", () => {
      buttonJoin.setFillStyle(0x333333); // Change color on click
      let gameId = prompt("Enter Game ID to Join:") || ""; // Prompt for Game ID
      this.socket.emit("joinLobby", gameId);
    });

    // Start Battle Button
    const buttonStartBattle = this.add
      .rectangle(1100, 790, 400, 100, 0x000000)
      .setInteractive();
    this.add.text(1010, 770, "Start Battle", {
      fontSize: "32px",
      color: "#ffffff",
    });

    buttonStartBattle.on("pointerdown", () => {
      buttonStartBattle.setFillStyle(0x333333); // Change color on click
      const gameId = prompt("Enter Game ID to Start Battle:") || ""; // Prompt for Game ID
      const player1Id = 1; // Replace with actual player 1 ID
      const player2Id = 2; // Replace with actual player 2 ID
      this.socket.emit("startBattle", gameId, player1Id, player2Id);
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
    this.socket.on("gameId", (gameId) => {
      this.updateGameCode(gameId);
      this.updateGameState(`Game ID: ${gameId}`);
    });
  }

  private updatePlayerList(players: Player[]) {
    const playerDetails = players.map(
      (player) =>
        `ID: ${player.id}, Gold: ${player.status.gold}, Health: ${player.status.health}`
    );
    this.playerListText.setText("Players:\n" + playerDetails.join("\n"));
  }

  private updateGameCode(gameId: string) {
    this.gameCode.setText(`${gameId}`);
  }

  private updateGameState(message: string) {
    this.gameStateText.setText(`Game State:\n${message}`);
  }
}
