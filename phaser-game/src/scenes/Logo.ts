import Phaser from "phaser";

export class Logo extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("Logo");
  }

  preload() {
    this.load.image("background", "assets/white.jpg");
    this.load.svg("logo", "assets/Bandit Logo Circle.svg");
  }

  create() {
    this.background = this.add.tileSprite(640, 360, 1280, 720, "background");

    this.logo = this.add
      .sprite(640, 360, "logo")
      .setOrigin(0.5, 0.5)
      .setAlpha(1) // Ensure full opacity
      .setDepth(2); // Make sure logo is above background
  }
}
