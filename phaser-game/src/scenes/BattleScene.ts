import Phaser from "phaser";
import { Characters } from "../../../backend/areas/Types/Character";

export class BattleScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private enemy!: Phaser.GameObjects.Sprite;
  private playerHealth: number = 10;
  private enemyHealth: number = 10;
  private playerHealthText!: Phaser.GameObjects.Text;
  private enemyHealthText!: Phaser.GameObjects.Text;

  constructor() {
    super("BattleScene");
  }

  preload() {
    this.load.image("battle-background", "assets/battle-bg.png");
  }

  create() {
    const screen = this.add.container(0, 0);
    const background = this.add.image(960, 540, "battle-background");
    screen.add(background);
  }
}
