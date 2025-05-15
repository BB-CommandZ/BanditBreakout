import Phaser from "phaser";
import { Characters, ICharacter } from "../../../backend/areas/Types/Character"
import WebFontLoader from "webfontloader";
import settingsListener from "../middleware/settingsListener";

export class CharacterSelection extends Phaser.Scene {
  private charNameText!: Phaser.GameObjects.Text;
  private charDescriptionText!: Phaser.GameObjects.Text;
  private charIndex: number = 0;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;
  private dKey!: Phaser.Input.Keyboard.Key;
  private characterCircles: Phaser.GameObjects.Container[] = [];
  private characterFront!: Phaser.GameObjects.Image;
  // this is needed for cropping chars
  private characterCropSettings: {[key: string]: {crop: boolean, amount?: number}} = {
    "buckshot": { crop: true, amount: 0.9 },  
    "serpy": { crop: false,},     
    "grit": { crop: true, amount: 0.9 },                  
    "solstice": { crop: true, amount: 0.9 },      
    "scout": { crop: true, amount: 0.8 }    
  };
  // this is for positioning chars more center-ly
  private characterPositionSettings: { [key: string]: { x: number; y: number; width: number; height: number } } = {
    "buckshot": { x: 50, y: 50, width: 0.26, height: 0.26 },
    "serpy": { x: -50, y: 50, width: 0.3, height: 0.3 },
    "grit": { x: 0, y: 50, width: 0.25, height: 0.25 },
    "solstice": { x: 0, y: 100, width: 0.3, height: 0.3 },
    "scout": { x: -20, y: 120, width: 0.28, height: 0.28 }
  };
  private headSettings: { [key: string]: { x: number; y: number; scale: number } } = {
    "buckshot": { x: 20, y: 100, scale: 250 },
    "serpy": { x: -30, y: 70, scale: 200 },
    "grit": { x: 0, y: 80, scale: 210 },
    "solstice": { x: -5, y: 50, scale: 170 },
    "scout": { x: -10, y: 80, scale: 200 },
  };



  constructor() {
    super("CharacterSelection");
  }

  preload() {

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    this.load.setBaseURL(serverUrl);          
    this.load.setPath('assets');       
      
    this.load.image("overlayBacking", encodeURIComponent("tempAssets/charSelection/backing.png"));
    this.load.image("overlayFrame", encodeURIComponent("tempAssets/charSelection/frame.png"));
    this.load.image("overlayPage", encodeURIComponent("tempAssets/charSelection/page.png"));
    this.load.image("ovelayBackSign", encodeURIComponent("tempAssets/charSelection/backSign.png"));
    this.load.image("charSign", encodeURIComponent("tempAssets/charSelection/charSign.png"));

    this.load.svg("buckshot", encodeURIComponent("tempAssets/charSelection/buckshotFront.svg"));
    this.load.svg("serpy", encodeURIComponent("tempAssets/charSelection/serpyFront.svg"));
    this.load.svg("grit", encodeURIComponent("tempAssets/charSelection/gritFront.svg"));
    this.load.svg("scout", encodeURIComponent("tempAssets/charSelection/scoutFront.svg"));
    this.load.svg("solstice", encodeURIComponent("tempAssets/charSelection/solsticeFront.svg"));

    WebFontLoader.load({
      custom: {
        families: ['Wellfleet', 'WBB'],
        urls: ['/fonts.css']
      }
    });
}

  create() {
    //screen
    const screen = this.add.container(0, 0);

    const background = this.add.graphics().fillStyle(0x573912).fillRect(0, 0, 1920, 1080);
    screen.add(background);

    
    const containerMain = this.add.container(960, 540);
    screen.add(containerMain);
    

    //containerBackButton
    const containerBackButton = this.add.container(-900, -350);
    const overlayBackSign = this.add.image(0, 0, "ovelayBackSign");
    overlayBackSign.setDisplaySize(overlayBackSign.width * 0.3, overlayBackSign.height * 0.32);
    containerBackButton.add(overlayBackSign);
    const backButtonText = this.add.text(0, -140, "Back", {
        fontFamily: "WBB",
        fontSize: 120,
        color: "#492807",
    });
    backButtonText.setRotation(-0.05);
    containerBackButton.add(backButtonText);
    const backButtonInteractive = this.add.graphics();
    backButtonInteractive.fillStyle(0x000000, 0)
    .fillRect(0, 30, 300, 130)
    backButtonInteractive.setInteractive(new Phaser.Geom.Rectangle(0, 30, 300, 130), Phaser.Geom.Rectangle.Contains);
    backButtonInteractive.on("pointerdown", () => {
      this.scene.stop(this)
        this.scene.start("MainScreen")
  });


    containerMain.add(containerBackButton);



    //containerMain

  //containerLeft
  const containerLeft = this.add.container(-450, 0);

  // from here until container right its weird, because of how phaser works with depth
  this.characterFront = this.add.image(0, 0, Characters[this.charIndex].name.toLowerCase());
  const charName = Characters[this.charIndex].name.toLowerCase();
  const originalWidth = this.characterFront.width;
  const originalHeight = this.characterFront.height;

  const cropSettings = this.characterCropSettings[charName];
  if (cropSettings && cropSettings.crop) {
    const cropHeight = Math.floor(originalHeight * (cropSettings.amount || 1));
    const cropRect = new Phaser.Geom.Rectangle(
      0,
      0,
      originalWidth,
      cropHeight
    );
    this.characterFront.setCrop(cropRect);
  }
  this.characterFront.setDisplaySize(this.characterFront.width * 0.26, this.characterFront.height * 0.26);
  containerLeft.add(this.characterFront);
  
  containerMain.add(containerLeft);
  
  const overlayBackground = this.add.image(0, 0, "overlayBacking");
  containerMain.add(overlayBackground);
  
  const overlayFrame = this.add.image(-450, 0, "overlayFrame");
  containerMain.add(overlayFrame);





    //containerRight
    const containerRight = this.add.container(400, 0);
    containerMain.add(containerRight);

    const overlayPage = this.add.image(0, 0, "overlayPage");
    containerRight.add(overlayPage);


    //containerCharDescription
    const containerCharDescription = this.add.container(-200, -100);
    containerRight.add(containerCharDescription);

    this.charNameText = this.add.text(200, -180, "charName", {
        fontFamily: "WBB",
        fontSize: 120,
        color: "#000000",
    });
    this.charNameText.setOrigin(0.5, 0);
    containerCharDescription.add(this.charNameText);

    this.charDescriptionText = this.add.text(-20, -50, "charDesc", {
        fontFamily: "Wellfleet",
        fontSize: 24,
        color: "#000000",
        wordWrap: { width: 480, useAdvancedWrap: true,  },
        align: "center",
    });
    containerCharDescription.add(this.charDescriptionText);


    //containerCharSign
    const containerCharSign = this.add.container(0, 220);
    containerRight.add(containerCharSign);
    
    const overlayCharSign = this.add.image(0, 0, "charSign");
    overlayCharSign.setDisplaySize(overlayCharSign.width * 0.45, overlayCharSign.height * 0.45);
    containerCharSign.add(overlayCharSign);
    
    const charSignText = this.add.text(-100, -110, "Select", {
        fontFamily: "WBB",
        fontSize: 120,
        color: "#492807",
    });
    containerCharSign.add(charSignText);
    // need to add the character selection for player here, 
    // but we need game to work. for which we need mainscreen. TODO

const selectInteractive = this.add.graphics();
selectInteractive.fillStyle(0x000000, 0)
.fillRect(overlayCharSign.x - 200, -110, 400, 110)
.setInteractive(new Phaser.Geom.Rectangle(overlayCharSign.x - 200, -110, 400, 110), Phaser.Geom.Rectangle.Contains);

containerCharSign.add(selectInteractive);

selectInteractive.on('pointerdown', () => {
    // Get the asset path for the selected character
    const assetPath = this.getCharacterAssetPath(Characters[this.charIndex].id);
    console.log(`Starting MapScene with character asset: ${assetPath}`);
    // Start MapScene and pass the character asset path as data
    this.scene.start("MapScene", { characterAsset: assetPath });
});



    //containerBottom
    const containerBottom = this.add.container(960, 980);
    screen.add(containerBottom);

    const containerCharIcon = this.add.container(0, 0);
    containerBottom.add(containerCharIcon);




    // Interactions
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.aKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.createCharacterCircles(containerBottom);
  
    this.updateCharacterDisplay(0)
    
    //esc -> settings
    
    settingsListener(this);
  }



  // make character circles and add updateCharDisplay func on click
  private createCharacterCircles(parent: Phaser.GameObjects.Container) {
    const circleSpacing = 200;
    const startX = -((Characters.length - 1) * circleSpacing) / 2;
    
    for (let i = 0; i < Characters.length; i++) {
      const containerCharIcon = this.add.container(startX + i * circleSpacing, 0);
      parent.add(containerCharIcon);
      
      // background circle
      const charCircle = this.add.graphics()
        .fillStyle(0xB7B7B7)
        .fillCircle(0, 0, 70);
      
      //characters
      const charName = Characters[i].name.toLowerCase()
      const headSettings = this.headSettings[charName];
      const charHead: Phaser.GameObjects.Image = this.add.image(0, 0, charName)
          .setTint(0x676767)
          .setDisplaySize(
              headSettings.scale,
              headSettings.scale * 1.3
          )
          .setPosition(headSettings.x, headSettings.y);

      const maskCircle = this.add.circle(startX + i * circleSpacing + 960, 980, 70, 0x000000).setVisible(false);
      const mask = maskCircle.createGeometryMask();
      charHead.setMask(mask);

      
      const hitArea = new Phaser.Geom.Circle(0, 0, 70);
      containerCharIcon.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      
      containerCharIcon.add(charCircle);
      containerCharIcon.add(charHead);
      
      containerCharIcon.on('pointerdown', () => {
        this.updateCharacterDisplay(i);
      });
      
      this.characterCircles.push(containerCharIcon);
    }
    
    this.highlightSelectedCircle(0);
  }
  



  // highlight selected (darken others)
  private highlightSelectedCircle(index: number) {
    
    this.characterCircles.forEach((container, i) => {
      const circle = container.getAt(0) as Phaser.GameObjects.Graphics;
      const charHead = container.getAt(1) as Phaser.GameObjects.Image;

      circle.clear();
      circle.fillStyle(i === index ? 0xD7D7D7 : 0x676767);
      circle.fillCircle(0, 0, 70);

      if (i === index) {
        charHead.setTint(0xD7D7D7); // Apply a gold tint to the selected character
      } else {
        charHead.setTint(0x676767)
      }
    });

  }




  // update text for char and highlight
  private updateCharacterDisplay(index: number) {
    if (index >= 0 && index < Characters.length) {
      
      this.charIndex = index;
 
      this.charNameText.setText(Characters[index].name);
      this.charDescriptionText.setText(Characters[index].description);

      const charName = Characters[index].name.toLowerCase();

      // character switching animation + adding heads
      this.tweens.add({
        targets: this.characterFront,
        alpha: 0,
        duration: 150,
        onComplete: () => {
          this.characterFront.setTexture(charName);
          // cropping is also done here, because of idk why, thats how phaser works
          this.characterFront.setCrop();
          
          const cropSettings = this.characterCropSettings[charName];
          if (cropSettings && cropSettings.crop) {
            const originalWidth = this.characterFront.width;
            const originalHeight = this.characterFront.height;
            const cropHeight = Math.floor(originalHeight * (cropSettings.amount || 1));
            this.characterFront.setCrop(0, 0, originalWidth, cropHeight);
          }

        // position and size
        const posSettings = this.characterPositionSettings[charName];
        this.characterFront.setPosition(posSettings.x, posSettings.y);
        this.characterFront.setDisplaySize(
          this.characterFront.width * posSettings.width,
          this.characterFront.height * posSettings.height
        );
          
          this.tweens.add({
            targets: this.characterFront,
            alpha: 1,
            duration: 150
          });
        }
      });
      
      this.highlightSelectedCircle(index);
    }
  }




// this is for going to 0 after end and vise versa
  private changeCharacter(direction: number) {
    
    const newIndex = (this.charIndex + direction + Characters.length) % Characters.length;
    this.updateCharacterDisplay(newIndex);
  }




  update() {
    
    //prev char
    if (Phaser.Input.Keyboard.JustDown(this.leftKey) || Phaser.Input.Keyboard.JustDown(this.aKey)) {
      this.changeCharacter(-1);
    }
    
    //next char
    if (Phaser.Input.Keyboard.JustDown(this.rightKey) || Phaser.Input.Keyboard.JustDown(this.dKey)) {
      this.changeCharacter(1);
    }
    
  }

  // Utility to map character IDs to asset paths
    // Utility to map character IDs to asset paths (relative to phaser-game directory)
    private getCharacterAssetPath(characterId: number): string {
      const characterMap: { [key: number]: string } = {
        1: 'tempAssets/charSelection/buckshotFront.svg',
        2: 'tempAssets/charSelection/serpyFront.svg',
        3: 'tempAssets/charSelection/gritFront.svg',
        4: 'tempAssets/charSelection/solsticeFront.svg',
        5: 'tempAssets/charSelection/scoutFront.svg'
        // Add other character mappings here
      };
      return characterMap[characterId] || 'tempAssets/charSelection/solsticeFront.svg'; // Default to Solstice if ID not found
    }


}
