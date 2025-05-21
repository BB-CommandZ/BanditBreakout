import Phaser from "phaser";
import { Characters } from "../../../backend/areas/Types/Character";
import WebFontLoader from "webfontloader";

export class BattleScene extends Phaser.Scene {
  private playerName: string = "Scout";
  private enemyName: string = "Wim";
  private selectedCharacterId = 1;
  private enemyCharacterId = 2;

  private fontsReady = false;

  // Add character settings for battle scene
  private characterSettings: {
    [key: string]: { scale: number; offsetY: number };
  } = {
    buckshot: { scale: 0.8, offsetY: 0 },
    serpy: { scale: 0.7, offsetY: -30 },
    grit: { scale: 0.75, offsetY: -20 },
    solstice: { scale: 0.65, offsetY: -50 },
    scout: { scale: 0.7, offsetY: -30 },
  };

  constructor() {
    super("BattleScene");
  }

  init(data: {
    playerId?: number;
    enemyId?: number;
    selectedCharacterId?: number;
    enemyCharacterId?: number;
  }) {
    // Store the character IDs
    if (data.selectedCharacterId) {
      this.selectedCharacterId = data.selectedCharacterId;
    }
    if (data.enemyCharacterId) {
      this.enemyCharacterId = data.enemyCharacterId;
    }

    // For player
    const playerCharId = data.selectedCharacterId;
    if (typeof playerCharId === "number") {
      const playerChar = Characters.find((c) => c.id === playerCharId);
      if (playerChar) this.playerName = playerChar.name;
    }
    // For enemy
    const enemyCharId = data.enemyCharacterId;
    if (typeof enemyCharId === "number") {
      const enemyChar = Characters.find((c) => c.id === enemyCharId);
      if (enemyChar) this.enemyName = enemyChar.name;
    }
  }

  preload() {
    const serverUrl =
      import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    this.load.setBaseURL(serverUrl);
    this.load.setPath("assets");

    // - battle_screen/shield.png
    // - battle_screen/victory.svg
    // - battle_screen/background.png
    // - battle_screen/defeat.svg
    // - battle_screen/health backing.svg
    // - battle_screen/health bar.svg
    //- player_overlay/banner.svg

    this.load.image("battle-background", "battle_scene/battle-bg.png");
    this.load.svg("health-bar 1", "battle_scene/health bar.svg");
    this.load.svg("health-bar 2", "battle_scene/health bar.svg");
    this.load.image("health-back-bar 1", "battle_scene/backing-green.png");
    this.load.image("health-back-bar 2", "battle_scene/backing-green.png");
    this.load.svg("banner 1", "battle_scene/banner.svg");
    this.load.svg("banner 2", "battle_scene/banner.svg");
    // this.load.svg("buckshot-back", "battle_scene/buckshot-back.svg");
    // this.load.svg("wim-front", "battle_scene/wim-front.svg");
    this.load.svg("attack-button", "battle_scene/health backing.svg");
    this.load.svg("defend-button", "battle_scene/health backing.svg");

    Characters.forEach((char) => {
      // Load front view
      this.load.svg(
        char.name.toLowerCase(),
        encodeURIComponent(
          `character_asset/${char.name.toLowerCase()}Front.svg`
        )
      );
    });

    this.load.svg(
      "buckshot-back",
      encodeURIComponent("characterSVGs/Buckshot/005-cropped (1).svg")
    );

    this.load.svg(
      "grit-back",
      encodeURIComponent("characterSVGs/Grit/006-cropped (1).svg")
    );

    this.load.svg(
      "serpy-back",
      encodeURIComponent("characterSVGs/Serpy/006-cropped (4).svg")
    );

    this.load.svg(
      "solstice-back",
      encodeURIComponent("characterSVGs/Solstice/006-cropped (5).svg")
    );

    this.load.svg(
      "scout-back",
      encodeURIComponent("characterSVGs/Scout/006-cropped (3).svg")
    );

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
    const bannerOneText = this.add.text(-165, 70, this.enemyName, {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#462406",
      align: "center",
    });
    bannerOneText.setOrigin(0.5);
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
    const bannerTextTwo = this.add.text(-165, 70, this.playerName, {
      fontFamily: "WBB",
      fontSize: 45,
      color: "#462406",
      align: "center",
    });
    bannerTextTwo.setOrigin(0.5);
    bannerTwoContainer.add(bannerTextTwo);

    const playerContainer = this.add.container(800, 700);
    

    // Debug logs
    const backKey = `${this.playerName.toLowerCase()}-back`;
    console.log("Loading back image with key:", backKey);
    console.log("Available texture keys:", this.textures.list);

    // Display player character (back view) with similar scaling

    let backTexture = "";
    const selectedCharId = this.selectedCharacterId;

    if (selectedCharId) {
      switch (selectedCharId) {
        case 1:
          backTexture = "buckshot-back";
          break;
        case 2:
          backTexture = "serpy-back";
          break;
        case 3:
          backTexture = "grit-back";
          break;
        case 4:
          backTexture = "solstice-back";
          break;
        case 5:
          backTexture = "scout-back";
          break;
      }
    }

    const playerChar = this.add.image(-40, 70, backTexture);
    const playerSettings = this.characterSettings[
      this.playerName.toLowerCase()
    ] || { scale: 0.7, offsetY: 0 };
    const baseSize = 600;
    const playerScaledSize = baseSize * playerSettings.scale * 1.2; // Slightly larger for player
    playerChar.setDisplaySize(playerScaledSize * 0.8, playerScaledSize);
    playerChar.setY(playerChar.y + playerSettings.offsetY);
    playerContainer.add(playerChar);

    const enemyContainer = this.add.container(1430, 300);
    

    // Display enemy character (front view)
    const enemyChar = this.add.image(-20, 70, this.enemyName.toLowerCase());
    const settings = this.characterSettings[this.enemyName.toLowerCase()] || {
      scale: 0.7,
      offsetY: 0,
    };
    const scaledSize = baseSize * settings.scale;
    enemyChar.setDisplaySize(scaledSize * 0.8, scaledSize);
    enemyChar.setY(enemyChar.y + settings.offsetY);
    enemyContainer.add(enemyChar);
  }
}
