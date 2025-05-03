import Phaser from "phaser";
export class Start extends Phaser.Scene {
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("Start");
  }

  preload() {
    this.load.image("background", "assets/black-background.png");
  }

  create() {
    this.background = this.add.tileSprite(640, 360, 1280, 720, "background");

    this.time.delayedCall(3000, () => {
      this.scene.start("GroupLogo");
      this.scene.stop("Start");
    });
  }
}
