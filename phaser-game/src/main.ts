import { Start } from "./scenes/Start";
import { CharacterSelection } from "./scenes/CharacterSelection";
import { MainScreen, ConnectionMenu, HostRoom, JoinCode, } from "./scenes/MainScreen";
import { LoadingScreen } from "./scenes/LoadingScreen";
import { CutScene } from "./scenes/CutScene";
import { SettingsMenu } from "./scenes/Settings";
import { EmptyTest } from "./scenes/EmptyTest";
import { MapScene } from "./scenes/MapScene";
import { HostJoinWorkaround } from "./scenes/HostJoinWorkaround";

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

    MainScreen,
    ConnectionMenu,
    HostRoom,
    JoinCode,
    HostJoinWorkaround,
    // Guide,
    // CharacterSelection,
    // SettingsMenu,
    MapScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  loader: {
    crossOrigin: 'anonymous'
  }
};

new Phaser.Game(config);
