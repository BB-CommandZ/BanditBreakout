import { Start } from "./scenes/Start";
import { CharacterSelection } from "./scenes/CharacterSelection";
import { MainScreen, Host, Code, Room } from "./scenes/MainScreen";
import { LoadingScreen } from "./scenes/LoadingScreen";
import { CutScene } from "./scenes/CutScene";
import { SettingsMenu } from "./scenes/Settings";
import { EmptyTest } from "./scenes/EmptyTest";
import { MapScene } from "./scenes/MapScene";
import { HostJoinWorkaround } from "./scenes/HostJoinWorkaround";
import { BattleScene } from "./scenes/BattleScene";
import BattleResultScene  from "./scenes/BattleResultScene";
import { Gui } from "./scenes/Gui";
import ShopScene from "./scenes/ShopScene"; // Import ShopScene
import { SocketService } from "./services/SocketService"; // Import SocketService

const config = {
  type: Phaser.AUTO,
  title: "Bandit Breakout",
  description: "Turn-based RGP",
  parent: "game-container",
  width: 1920,
  height: 1080,
  backgroundColor: "#000000",
  pixelArt: false,
  scene: [
    // EmptyTest,
    // Start,
    // CutScene,
    // LoadingScreen,
    // MainScreen,
    // Host,
    // Code,
    // Room,
    HostJoinWorkaround,
    CharacterSelection,
    // // SettingsMenu,
    Gui,
    MapScene,
    BattleScene,
    BattleResultScene,
    ShopScene, // Add ShopScene to the scene list
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  loader: {
    crossOrigin: 'anonymous'
  }
};

const game = new Phaser.Game(config); // Store the game instance

// Get the SocketService instance
const socketService = SocketService.getInstance();

// Listen for the 'shopOpen' event
socketService.on('shopOpen', (data: any) => {
    console.log("Received shopOpen event in main.ts", data);
    // Stop the current scene and start the ShopScene
    // Assuming the current active scene is MapScene when the shop opens
    game.scene.stop('MapScene');
    game.scene.start('ShopScene', data); // Pass the shop data to the ShopScene
});
