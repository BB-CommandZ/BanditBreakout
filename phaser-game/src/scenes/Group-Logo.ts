import Phaser from "phaser";

export class GroupLogo extends Phaser.Scene {
  private logo!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super("GroupLogo");
  }

  preload() {
    this.load.image("background", "assets/white.jpg");
    this.load.svg("logo", "assets/CMD Z Logo.svg");
  }

  create() {
    this.background = this.add
      .tileSprite(640, 360, 1280, 720, "background")
      .setDepth(1); // Ensure background is below logo

    this.logo = this.add
      .sprite(640, 360, "logo")
      .setOrigin(0.5, 0.5)
      .setAlpha(1) // Ensure full opacity
      .setDepth(2); // Make sure logo is above background

    this.time.delayedCall(4000, () => {
      this.scene.start("Logo");
      this.scene.stop("GroupLogo");
    });
  }
}
