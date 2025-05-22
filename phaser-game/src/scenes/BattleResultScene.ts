import Phaser from "phaser";

export default class BattleResultScene extends Phaser.Scene {
  constructor() {
    super("BattleResultScene");
  }

  preload() {
    // Set base URL and path for assets to load from the backend
    const serverUrl =
      import.meta.env.VITE_SERVER_URL || "http://localhost:3000"; // Backend server URL
    this.load.setBaseURL(serverUrl);
    this.load.setPath("assets"); // Path to assets served by the backend

    // Log the server URL for debugging
    console.log("Loading assets from:", serverUrl);

    // Load assets without encodeURIComponent to avoid potential URL issues
    this.load.image("background", "battle_screen/background.png");
    this.load.svg("defeat", "battle_screen/defeat.svg");
    this.load.svg("victory", "battle_screen/victory.svg");

    // Add listeners for load completion and errors
    this.load.on("complete", () =>
      console.log("All assets loaded for BattleResultScene")
    );
    this.load.on("loaderror", (file: any) =>
      console.error("Error loading asset:", file.key, file.src)
    );
  }

  create(data: { outcome?: "win" | "lose" } = { outcome: "win" }) {
    console.log("BattleResultScene create called with outcome:", data.outcome);

    // Display background
    const background = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "background"
    );
    background.setDisplaySize(
      this.cameras.main.width,
      this.cameras.main.height
    );
    background.setDepth(0); // Ensure background is at the bottom layer
    console.log(
      "Background added at:",
      this.cameras.main.centerX,
      this.cameras.main.centerY
    );

    // Display victory or defeat image based on outcome
    if (data.outcome === "win") {
      const victoryImage = this.add.image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "victory"
      );
      victoryImage.setDisplaySize(400, 200); // Explicitly set size for visibility
      victoryImage.setDepth(1); // Ensure it's above the background
      console.log(
        "Victory image added with dimensions:",
        victoryImage.width,
        victoryImage.height
      );
    } else {
      const defeatImage = this.add.image(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        "defeat"
      );
      defeatImage.setDisplaySize(400, 200); // Explicitly set size for visibility
      defeatImage.setDepth(1); // Ensure it's above the background
      console.log(
        "Defeat image added with dimensions:",
        defeatImage.width,
        defeatImage.height
      );
    }

    // Add input handling to return to the game
    this.input.once("pointerdown", () => {
      console.log("Pointer down detected, transitioning to MainScreen");
      this.scene.stop(); // Stop BattleResultScene
      this.scene.start("MainScreen"); // Assuming 'MainScreen' is your main game scene
    });
  }
}
