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
import { EndingScene } from "./scenes/EndingScene";

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
    // HostJoinWorkaround is the initial scene for the normal game flow.
    // Uncomment the line below to start the game from this scene.
    HostJoinWorkaround,
    CharacterSelection,
    // // SettingsMenu,
    Gui,
    MapScene,
    EndingScene,
    BattleScene,
    BattleResultScene,
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
