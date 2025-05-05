import Phaser from "phaser";
export class Start extends Phaser.Scene {
  private backgroundBlack!: Phaser.GameObjects.Image;
  private backgroundWhite!: Phaser.GameObjects.Image;
  private logoGame!: Phaser.GameObjects.Image;
  private logoTeam!: Phaser.GameObjects.Image;

  constructor() {
    super("Start");
  }

  preload() {
    this.load.image("backgroundBlack", "assets/black-background.png");
    this.load.image("backgroundWhite", "assets/white.jpg");
    this.load.svg("logoTeam", "assets/CMD Z Logo.svg");
    this.load.svg("logoGame", "assets/Bandit Logo Circle.svg");
  }

  create() {

    this.backgroundBlack = this.add.image(960, 540, "backgroundBlack");
    this.backgroundBlack.setOrigin(0.5);
    
    this.backgroundWhite = this.add.image(960, 540, "backgroundWhite");
    this.backgroundWhite.setOrigin(0.5);
    this.backgroundWhite.setAlpha(0);
    
    this.logoTeam = this.add.image(960, 540, "logoTeam");
    this.logoTeam.setOrigin(0.5);
    this.logoTeam.setAlpha(0);
    
    this.logoGame = this.add.image(960, 540, "logoGame");
    this.logoGame.setOrigin(0.5);
    this.logoGame.setAlpha(0);
    
    this.tweens.add({
      targets: this.backgroundBlack,
      alpha: 1,
      duration: 2000,
      delay: 0,
    });

    this.tweens.add({
      targets: this.backgroundWhite,
      alpha: 1,
      duration: 1000,
      delay: 2000,

    });

    this.tweens.add({
      targets: this.logoTeam,
      alpha: 1,
      duration: 1000,
      delay: 2000,
    });

    this.tweens.add({
        targets: this.logoTeam,
        alpha: 0,
        duration: 1000,
        delay: 3000,
      });
    
      this.tweens.add({
        targets: this.backgroundWhite,
        alpha: 0,
        duration: 1000,
        delay: 3000,
      });
    
    
    this.tweens.add({
      targets: this.logoGame,
      alpha: 1,
      duration: 1000,
      delay: 4000,
    });

    this.tweens.add({
        targets: this.logoGame,
        alpha: 0,
        duration: 1000,
        delay: 5000,
      });
    

    this.time.delayedCall(6000, () => {
        this.scene.start('MainMenu');
      }
    );
  }
}