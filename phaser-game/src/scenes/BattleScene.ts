import Phaser from "phaser";
import { Characters } from "../../../backend/areas/Types/Character";
import WebFontLoader from "webfontloader";

export class BattleScene extends Phaser.Scene {
  private playerName: string = "Buckshot";
  private enemyName: string = "Wim";

  private fontsReady = false;

  constructor() {
    super("BattleScene");
  }

  init(data: { playerId?: number; enemyId?: number }) {
    if (data.playerId) {
      const playerChar = Characters.find((c) => c.id === data.playerId);
      if (playerChar) this.playerName = playerChar.name;
    }
    if (data.enemyId) {
      const enemyChar = Characters.find((c) => c.id === data.enemyId);
      if (enemyChar) this.enemyName = enemyChar.name;
    }
  }

  preload() {
    this.load.image("battle-background", "assets/battle-bg.png");
    this.load.svg("health-bar 1", "assets/health bar.svg");
    this.load.svg("health-bar 2", "assets/health bar.svg");
    this.load.image("health-back-bar 1", "assets/backing-green.png");
    this.load.image("health-back-bar 2", "assets/backing-green.png");
    this.load.svg("banner 1", "assets/banner.svg");
    this.load.svg("banner 2", "assets/banner.svg");
    this.load.svg("buckshot-back", "assets/buckshot-back.svg");
    this.load.svg("wim-front", "assets/wim-front.svg");
    this.load.svg("attack-button", "assets/health backing.svg");
    this.load.svg("defend-button", "assets/health backing.svg");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
      active: () => {
        this.fontsReady = true;
      },
    });
  }

  create() {
    if (!this.fontsReady) {
      this.time.delayedCall(50, () => this.create(), [], this);
      return;
    }

    const screen = this.add.container(0, 0);
    const background = this.add.image(960, 540, "battle-background");
    background.setDisplaySize(1920, 1080);
    screen.add(background);

    // Player part
    const healthBackOneContainer = this.add.container(400, 150);
    const healthBackBarOne = this.add.image(0, 0, "health-back-bar 1");
    healthBackBarOne.setDisplaySize(600, 100);
    healthBackOneContainer.add(healthBackBarOne);

    const healthBarOneContainer = this.add.container(400, 150);
    const healthBarOne = this.add.image(0, 0, "health-bar 1");
    healthBarOne.setDisplaySize(700, 400);
    healthBarOneContainer.add(healthBarOne);

    const healthTextOne = this.add.text(-80, -10, "10/10", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#ffffff",
      align: "center",
    });
    healthBarOneContainer.add(healthTextOne);

    const hpTextOne = this.add.text(220, -10, "HP", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#000000",
      align: "center",
    });
    healthBarOneContainer.add(hpTextOne);

    const bannerOneContainer = this.add.container(400, 5);
    const bannerOne = this.add.image(0, 0, "banner 1");
    bannerOne.setDisplaySize(600, 350);
    bannerOneContainer.add(bannerOne);
    const bannerOneText = this.add.text(-230, 50, this.playerName, {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#462406",
      align: "center",
    });
    bannerOneContainer.add(bannerOneText);

    // Enemy part
    const healthBackTwoContainer = this.add.container(1500, 900);
    const healthBackBarTwo = this.add.image(0, 0, "health-back-bar 2");
    healthBackBarTwo.setDisplaySize(600, 100);
    healthBackTwoContainer.add(healthBackBarTwo);

    const healthBarTwoContainer = this.add.container(1500, 900);
    const healthBarTwo = this.add.image(0, 0, "health-bar 2");
    healthBarTwo.setDisplaySize(700, 400);
    healthBarTwoContainer.add(healthBarTwo);

    const healthTextTwo = this.add.text(-80, -10, "10/10", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#ffffff",
      align: "center",
    });
    healthBarTwoContainer.add(healthTextTwo);

    const hpTextTwo = this.add.text(220, -10, "HP", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#000000",
      align: "center",
    });
    healthBarTwoContainer.add(hpTextTwo);

    const bannerTwoContainer = this.add.container(1500, 755);
    const bannerTwo = this.add.image(0, 0, "banner 2");
    bannerTwo.setDisplaySize(600, 350);
    bannerTwoContainer.add(bannerTwo);
    const bannerTextTwo = this.add.text(-200, 50, this.enemyName, {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#462406",
      align: "center",
    });
    bannerTwoContainer.add(bannerTextTwo);

    const buckshotContainer = this.add.container(800, 700);
    // Add shadow for Buckshot
    const buckshotShadow = this.add.ellipse(-50, 250, 450, 90, 0x000000, 0.4);
    buckshotContainer.add(buckshotShadow);

    const buckshot = this.add.image(0, 0, "buckshot-back");
    buckshot.setDisplaySize(500, 600);
    buckshotContainer.add(buckshot);

    const wimContainer = this.add.container(1430, 300);
    // Add shadow for Wim
    const wimShadow = this.add.ellipse(-5, 230, 300, 40, 0x000000, 0.4);

    wimContainer.add(wimShadow);

    const wim = this.add.image(0, 0, "wim-front");
    wim.setDisplaySize(250, 500);
    wimContainer.add(wim);

    const attackButtonContainer = this.add.container(300, 900);
    const attackButton = this.add.image(0, 0, "attack-button");
    attackButton.setDisplaySize(500, 500);
    const attackText = this.add.text(-70, -10, "Attack", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#ffffff",
      align: "center",
    });
    attackButtonContainer.add([attackButton, attackText]);

    const defendButtonContainer = this.add.container(700, 900);
    const defendButton = this.add.image(0, 0, "defend-button");
    defendButton.setDisplaySize(500, 500);
    const defendText = this.add.text(-70, -10, "Defend", {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#ffffff",
      align: "center",
    });
    defendButtonContainer.add([defendButton, defendText]);
  }
}
