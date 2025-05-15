import Phaser from "phaser";


export class EmptyTest extends Phaser.Scene {

  constructor() {
    super("EmptyTest");
  }

  preload() {
   
    }
  

  create() {
    // Background
    this.add
      .graphics()
      .fillGradientStyle(0x000000, 0xff0000, 0xffffff, 0x00ffff)
      .fillRect(0, 0, 1920, 1080);

}
}