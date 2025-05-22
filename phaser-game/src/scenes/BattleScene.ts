import Phaser from "phaser";
import { Characters } from "../../../backend/areas/Types/Character";
import WebFontLoader from "webfontloader";
import { SocketService } from "../services/SocketService";
import { MapScene } from "./MapScene";

export class BattleScene extends Phaser.Scene {
  private socket = SocketService.getInstance();
  private gameId: string = "";
  private playerId: number = 0;
  private playerName: string = "Scout";
  private enemyName: string = "Wim";
  private selectedCharacterId = 1;
  private enemyCharacterId = 2;

  private fontsReady = false;

  private currentTurn: "player" | "enemy" = "player";
  private playerHP: number = 10;
  private enemyHP: number = 10;
  private diceVideos: Map<string, Phaser.GameObjects.Video> = new Map();
  private playerHealthBar!: Phaser.GameObjects.Image;
  private enemyHealthBar!: Phaser.GameObjects.Image;
  private playerHealthText!: Phaser.GameObjects.Text;
  private enemyHealthText!: Phaser.GameObjects.Text;

  private healthBackOneContainer!: Phaser.GameObjects.Container;
  private healthBackTwoContainer!: Phaser.GameObjects.Container;

  private battleStarted: boolean = false;

  private rollButton?: Phaser.GameObjects.Text;
  private diceResult?: Phaser.GameObjects.Text;
  private isRolling: boolean = false;

  // Add character settings for battle scene
  private characterSettings: {
    [key: string]: { scale: number; offsetY: number };
  } = {
    buckshot: { scale: 0.7, offsetY: 0 },
    serpy: { scale: 0.75, offsetY: -30 },
    grit: { scale: 0.75, offsetY: -20 },
    solstice: { scale: 0.65, offsetY: -50 },
    scout: { scale: 0.7, offsetY: -30 },
  };

  constructor() {
    super("BattleScene");
  }

  init(data: {
    gameId: string;
    playerId: number;
    selectedCharacterId?: number;
    enemyCharacterId?: number;
  }) {
    this.gameId = data.gameId;
    this.playerId = data.playerId;

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

    // Add dice video preloading
    for (let i = 1; i <= 6; i++) {
      this.load.video(`dice${i}`, `assets/dice/dice${i}.mp4`);
    }
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
    healthBarOne.setOrigin(0, 0.5); // Set origin to left side
    healthBarOne.setX(-350); // Adjust X position to align with backing
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
    healthBarTwo.setOrigin(0, 0.5); // Set origin to left side
    healthBarTwo.setX(-350); // Adjust X position to align with backing
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

    // For player character
    const playerContainer = this.add.container(800, 700);

    // Add shadow for player character (relative to container position)
    const playerShadow = this.add.ellipse(-90, 300, 450, 150, 0x000000, 0.4);
    playerContainer.add(playerShadow);

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

    // For enemy character
    const enemyContainer = this.add.container(1430, 300);

    // Add shadow for enemy character (relative to container position)
    const enemyShadow = this.add.ellipse(0, 200, 400, 130, 0x000000, 0.4);
    enemyContainer.add(enemyShadow);

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

    // Store references to health bars and texts
    this.playerHealthBar = healthBackBarTwo; // Changed from healthBarTwo
    this.enemyHealthBar = healthBackBarOne; // Changed from healthBarOne
    this.playerHealthText = healthTextTwo;
    this.enemyHealthText = healthTextOne;

    // Store container references
    this.healthBackOneContainer = healthBackOneContainer;
    this.healthBackTwoContainer = healthBackTwoContainer;

    // Initialize dice videos
    for (let i = 1; i <= 6; i++) {
      const video = this.add.video(960, 540, `dice${i}`);
      video.setVisible(false);
      this.diceVideos.set(`dice${i}`, video);
    }

    // Create dice roll button and start battle
    this.createDiceButton();
    this.battleStarted = true;
  }

  private createDiceButton() {
    // Position in bottom left corner
    const x = 100;
    const y = this.scale.height - 100;

    this.rollButton = this.add
      .text(x, y, "Roll Dice", {
        fontSize: "32px",
        backgroundColor: "#4CAF50",
        color: "#ffffff",
        padding: { x: 20, y: 10 },
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.handleDiceRoll());

    // Add dice result text below button
    this.diceResult = this.add.text(x, y + 50, "", {
      fontSize: "28px",
      color: "#ffffff",
    });

    this.updateRollButtonVisibility();
  }

  private handleDiceRoll() {
    if (this.isRolling || !this.rollButton) return;

    this.isRolling = true;
    const roll = Math.floor(Math.random() * 6) + 1;

    // Play dice animation
    const videoKey = `dice${roll}`;
    const video = this.diceVideos.get(videoKey);
    if (video) {
      video.setVisible(true);
      video.play();

      // Update after animation
      this.time.delayedCall(1000, () => {
        if (this.diceResult) {
          this.diceResult.setText(`Rolled: ${roll}`);
        }
        this.applyDamage(roll);
        video.setVisible(false);
        this.isRolling = false;
        this.switchTurns();
      });
    }
  }

  private switchTurns() {
    this.currentTurn = this.currentTurn === "player" ? "enemy" : "player";

    // If it's enemy turn, automatically roll after a delay
    if (this.currentTurn === "enemy") {
      this.time.delayedCall(1000, () => this.handleDiceRoll());
    }

    this.updateRollButtonVisibility();
  }

  private updateRollButtonVisibility() {
    if (this.rollButton) {
      this.rollButton.setVisible(this.currentTurn === "player");
    }
  }

  private applyDamage(amount: number) {
    if (this.currentTurn === "player") {
      // Player attacking enemy
      this.enemyHP = Math.max(0, this.enemyHP - amount);
      this.updateHealthBar(
        this.enemyHealthBar,
        this.enemyHealthText,
        this.enemyHP
      );
    } else {
      // Enemy attacking player
      this.playerHP = Math.max(0, this.playerHP - amount);
      this.updateHealthBar(
        this.playerHealthBar,
        this.playerHealthText,
        this.playerHP
      );
    }

    // Check for battle end
    if (this.enemyHP <= 0 || this.playerHP <= 0) {
      this.handleBattleEnd();
    }
  }

  private updateHealthBar(
    healthBackBar: Phaser.GameObjects.Image,
    healthText: Phaser.GameObjects.Text,
    currentHP: number
  ) {
    // Calculate health percentage
    const healthPercent = currentHP / 10;

    // Update the width of the green health bar while keeping its position fixed
    const originalWidth = 600;
    const newWidth = originalWidth * healthPercent;

    // Set the display size maintaining the height
    healthBackBar.setDisplaySize(newWidth, 100);

    // Important: Keep the x-position fixed by setting origin to right side (1, 0.5)
    // This makes it shrink from left to right while staying in place
    healthBackBar.setOrigin(0, 0.5);

    // Position adjustment to align with the brown backing bar
    if (healthBackBar === this.enemyHealthBar) {
      healthBackBar.setX(-300); // For enemy health bar (left side)
    } else {
      healthBackBar.setX(-300); // For player health bar (right side)
    }

    // Update health text
    healthText.setText(`${currentHP}/10`);
  }

  private handleBattleEnd() {
    const winner = this.playerHP > 0 ? "player" : "enemy";

    // Disable roll button
    if (this.rollButton) {
      this.rollButton.destroy();
    }

    // Show battle result
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        `${winner === "player" ? this.playerName : this.enemyName} wins!`,
        {
          fontSize: "64px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    // Return to map after delay
    this.time.delayedCall(2000, () => {
      this.scene.start("BattleResultScene", {
        outcome: winner === "player" ? "win" : "lose",
      });
    });
  }
}
