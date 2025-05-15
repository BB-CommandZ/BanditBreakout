import Phaser from "phaser";
import { io, Socket } from "socket.io-client";

export class BattleTest extends Phaser.Scene {
  private socket!: Socket;
  private player1HpText!: Phaser.GameObjects.Text;
  private player2HpText!: Phaser.GameObjects.Text;

  constructor() {
    super("BattleTest");
  }

  preload() {
    this.socket = io("http://localhost:3000");

    this.socket.on("connect", () => {
      console.log("Connected to server:", this.socket.id);
    });

    this.socket.on("battleStarted", (data) => {
      console.log("Battle started:", data);
    });

    this.socket.on("turnResult", (data) => {
      console.log("Turn result:", data.result);
      this.updateHp(data.player1Hp, data.player2Hp); // Update HP display
    });

    this.socket.on("turnProcessed", (data) => {
      console.log("Turn result:", data.result);
      this.updateHp(data.player1Hp, data.player2Hp); // Update HP display
    });
  }

  create() {
    // Display Player 1 HP
    this.player1HpText = this.add.text(100, 100, "Player 1 HP: 100", {
      fontSize: "24px",
      color: "#fff",
    });

    // Display Player 2 HP
    this.player2HpText = this.add.text(100, 150, "Player 2 HP: 100", {
      fontSize: "24px",
      color: "#fff",
    });

    // Add Attack Button
    const attackButton = this.add
      .text(400, 300, "Attack", { fontSize: "32px", color: "#fff" })
      .setInteractive()
      .on("pointerdown", () => {
        console.log("Attack button clicked");
        this.socket.emit("submitAction", "attack"); // Emit attack action
      });

    // Add Defense Button
    const defenseButton = this.add
      .text(400, 400, "Defense", { fontSize: "32px", color: "#fff" })
      .setInteractive()
      .on("pointerdown", () => {
        console.log("Defense button clicked");
        this.socket.emit("submitAction", "defense"); // Emit defense action
      });
  }

  private updateHp(player1Hp: number, player2Hp: number) {
    this.player1HpText.setText(`Player 1 HP: ${player1Hp}`);
    this.player2HpText.setText(`Player 2 HP: ${player2Hp}`);
  }
}
