import { ITEM_LIST } from "../../../backend/areas/Types/Item";
import { Characters } from "../../../backend/areas/Types/Character";
import WebFontLoader from "webfontloader";



export class Gui extends Phaser.Scene {
  
    private charIndex: number = 0;
    private itemIndex: number = 8;
    private itemIcons: Phaser.GameObjects.Image[] = [];
    private nextItemIndex: number = 8;
    private charIcon!: Phaser.GameObjects.Image;
    private charCircle!: Phaser.GameObjects.Graphics;
    private charMask!: Phaser.GameObjects.Arc;

    private headSettings: { [key: string]: { x: number; y: number; scale: number } } = {
      "buckshot": { x: 20, y: 100, scale: 250 },
      "serpy": { x: -30, y: 70, scale: 200 },
      "grit": { x: 0, y: 80, scale: 210 },
      "solstice": { x: -5, y: 50, scale: 170 },
      "scout": { x: -10, y: 80, scale: 200 },
    };

    constructor() {
      super("Gui");
    }
  
    preload() {
      this.load.image("coin_icon", "tempAssets/gui/coin_icon.png");
      this.load.svg("backing", "tempAssets/gui/backing.svg");
      this.load.svg("banner", "tempAssets/gui/banner.svg");
      this.load.svg("board", "tempAssets/gui/board.svg");
      this.load.svg("frame", "tempAssets/gui/frame.svg");
      ITEM_LIST.forEach(item => {
        this.load.svg(item.name.toLowerCase(), `tempAssets/items/${item.name.toLowerCase()}_zoom.svg`);
      })
      Characters.forEach(char => {
        this.load.svg(char.name.toLowerCase(), `tempAssets/charSelection/${char.name.toLowerCase()}Front.svg`);
      });

      WebFontLoader.load({
            custom: {
              families: ['Wellfleet', 'WBB'],
              urls: ['/fonts.css']
            }
          });
    }
  
    create() {
        const board = this.add.image(290, 930, "board");
        board.setDisplaySize(board.width * 0.3, board.height * 0.3);
        
        const backing = this.add.image(250, 930, "backing");
        backing.setDisplaySize(backing.width * 0.2, backing.height * 0.2);
        
        const iconX = 140;
        const iconY = 915;
        const circleRadius = 80;

        // SOCKET IO CHARACTER HERE
        const charName = Characters[this.charIndex].name.toLowerCase();
        const headSettings = this.headSettings[charName];

        // Add character head image with settings
        this.charIcon = this.add.image(iconX + headSettings.x, iconY + headSettings.y, charName);
        this.charIcon.setDisplaySize(headSettings.scale, headSettings.scale * 1.3);

        // Create a circular mask for the icon
        this.charMask = this.add.circle(iconX, iconY, circleRadius, 0xffffff, 1).setVisible(false);
        const mask = this.charMask.createGeometryMask();
        this.charIcon.setMask(mask);

        const frame = this.add.image(iconX + 112, iconY + 15, "frame");
        frame.setDisplaySize(frame.width * 0.21, frame.height * 0.21);

        const banner = this.add.image(iconX + 155, iconY + 10, "banner");
        banner.setDisplaySize(banner.width * 0.3, banner.height * 0.3);

        // SOCKET IO CHARACTER HERE
        const bannerText = this.add.text(iconX, iconY + 75, Characters[this.charIndex].name, {
            fontFamily: "WBB",
            fontSize: 32,
            color: "#000000",
            align: "center",
        });
        bannerText.setOrigin(0.5, 0.5);

        const coinIcon = this.add.image(iconX + 100, iconY - 50, "coin_icon");
        coinIcon.setDisplaySize(coinIcon.width * 0.03, coinIcon.height * 0.03);

        //socketio player money here
        const coinText = this.add.text(iconX + 135, iconY - 50, "0", {
            fontFamily: "Wellfleet",
            fontSize: 40,
            color: "#492807",
            align: "center",
        });
        coinText.setOrigin(0.5, 0.5);

        // socketIo here
        const item = ITEM_LIST[this.itemIndex];
        const itemIcon = this.add.image(iconX + 150, iconY + 30, item.name.toLowerCase());
        itemIcon.setDisplaySize(itemIcon.width * 0.1, itemIcon.height * 0.1);
        itemIcon.setInteractive({ useHandCursor: true });
        this.itemIcons.push(itemIcon);

        itemIcon.on('pointerdown', () => {
            this.addNextItemIcon();
        });

        const guiContainer = this.add.container(0, 0);
        guiContainer.add([board, backing, this.charIcon, frame, banner, bannerText, coinIcon, coinText, ...this.itemIcons]);
    }

    //socketio items here, also adjust numbers

    private addNextItemIcon() {

      const item = ITEM_LIST[this.nextItemIndex];
      const newIcon = this.add.image(240, 915, item.name.toLowerCase());
      newIcon.setDisplaySize(newIcon.width * 0.1, newIcon.height * 0.1);
      newIcon.setInteractive({ useHandCursor: true });

      // Optional: allow chaining more items on click
      newIcon.on('pointerdown', () => {
          this.addNextItemIcon();
      });

      this.itemIcons.push(newIcon);

      // Add to container if you want them grouped
      const guiContainer = this.children.getByName('guiContainer') as Phaser.GameObjects.Container;
      if (guiContainer) {
          guiContainer.add(newIcon);
      }
  }
}