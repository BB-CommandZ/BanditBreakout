import Phaser from "phaser";
import settingsListener from "../middleware/settingsListener";
import { SocketService } from "../services/SocketService";

export class EmptyTest extends Phaser.Scene {
  private socket = SocketService.getInstance();

  constructor() {
    super("EmptyTest");
  }

  create() {
    this.add
      .graphics()
      .fillGradientStyle(0x000000, 0xff0000, 0xffffff, 0x00ffff)
      .fillRect(0, 0, 1920, 1080);
    settingsListener(this);

    // Create a game for testing
    const testGameId = "test_battle_game";

    // First player
    this.socket.emit("hostLobby");

    this.socket.on("gameId", (data: { gameId: string; playerId: number }) => {
      // Start battle scene for first player
      this.scene.start("BattleScene", {
        gameId: data.gameId,
        playerId: data.playerId,
        selectedCharacterId: 1, // Buckshot
        enemyCharacterId: 2, // Serpy
      });

      // For testing second player, open another browser window
      // and join with the gameId shown in console
      console.log("Game created with ID:", data.gameId);
    });
  }
}
