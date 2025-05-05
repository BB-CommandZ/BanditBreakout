import Phaser from 'phaser';

export class Title extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private pole!: Phaser.GameObjects.Image;
  private titleCard!: Phaser.GameObjects.Image;
  private start!: Phaser.GameObjects.Image;
  private options!: Phaser.GameObjects.Image;
  private quit!: Phaser.GameObjects.Image;

  constructor() {
    super("Title");
  }

  preload() {
    this.load.image("background", "assets/title background.png");
    this.load.image("pole", "assets/pole.png");
    this.load.image("title-card", "assets/title card.png");
    this.load.image("start", "assets/start.png");
    this.load.image("options", "assets/options.png");
    this.load.image("quit", "assets/quit.png");
  }

  create() {
    this.background = this.add.image(960, 540, "background");
    this.pole = this.add.image(960, 540, "pole");
    this.titleCard = this.add.image(960, 540, "title-card");
    this.start = this.add.image(960, 540, "start");
    this.options = this.add.image(960, 540, "options");
    this.quit = this.add.image(960, 540, "quit");
  }
}