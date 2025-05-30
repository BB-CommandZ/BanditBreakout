import { ok } from "assert";
import Phaser from "phaser";
import WebFontLoader from "webfontloader";
import settingsListener from "../middleware/settingsListener";
import { io, Socket } from "socket.io-client";







// MAIN MENU
export class MainScreen extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private pole!: Phaser.GameObjects.Image;
  private titleCard!: Phaser.GameObjects.Image;
  private start!: Phaser.GameObjects.Image;
  private options!: Phaser.GameObjects.Image;
  private quit!: Phaser.GameObjects.Image;

  constructor() {
    super("MainScreen");
  }

  preload() {
    this.load.image("background-main", "assets/background.png");
    this.load.image("pole", "assets/pole.png");
    this.load.image("title-card", "assets/title card.png");
    this.load.image("start", "assets/start.png");
    this.load.image("options", "assets/options.png");
    this.load.image("quit", "assets/quit.png");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create() {
    const screen = this.add.container(0, 0);

    const background = this.add.image(960, 540, "background-main");
    screen.add(background);

    const optionsContainer = this.add.container(0, 0);
    const options = this.add.image(960, 540, "options");
    const optionsText = this.add.text(570, 805, "Settings", {
      fontFamily: "WBB",
      fontSize: 120,
      color: "#492807",
    });
    optionsContainer.add(options);
    optionsContainer.add(optionsText);
    const optionsInteractive = this.add.graphics();
    optionsInteractive.fillStyle(0x000000, 0.0);
    optionsInteractive.fillRect(500, 805, 400, 130);
    optionsInteractive.setInteractive(
      new Phaser.Geom.Rectangle(500, 805, 400, 130),
      Phaser.Geom.Rectangle.Contains
    );
    optionsInteractive.on("pointerdown", () => {
        this.scene.pause();
        this.scene.launch('Settings', { previousSceneKey: this.scene.key });
    });
    optionsContainer.add(optionsInteractive);
    
    const poleContainer = this.add.container(0, 0);
    const pole = this.add.image(860, 540, "pole");
    pole.setDisplaySize(1600, 1080);
    poleContainer.add(pole);

    const titleContainer = this.add.container(0, 0);
    const titleCard = this.add.image(960, 540, "title-card");
    titleCard.setDisplaySize(1920, 1000);
    titleContainer.add(titleCard);
    const titleCardText = this.add
      .text(450, 190, "Bandit Breakout", {
        fontFamily: "WBB",
        fontSize: 250,
        color: "#492807",
      })
      .setRotation(-0.03);
    titleContainer.add(titleCardText);

    const startContainer = this.add.container(940, 540);
    const start = this.add.image(0, 0, "start");
    const startText = this.add.text(-410, 130, "Start", {
      fontFamily: "WBB",
      fontSize: 100,
      color: "#492807",
    });
    startContainer.add([start, startText]);
    titleContainer.add(startContainer);

    const quit = this.add.image(940, 540, "quit");
    const quitText = this.add.text(120, 910, "Quit", {
      fontFamily: "WBB",
      fontSize: 120,
      color: "#492807",
    });

    titleContainer.add(quit);
    titleContainer.add(quitText);

    startContainer.setInteractive(
      new Phaser.Geom.Rectangle(startText.x - 170, startText.y - 20, 450, 130),
      Phaser.Geom.Rectangle.Contains
    );
    startContainer.on("pointerdown", () => {
      this.scene.start("ConnectionMenu");
    });

    settingsListener(this);
  }
}







// HOST OR JOIN

export class ConnectionMenu extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;

  constructor() {
    super("ConnectionMenu");
  }

  preload() {
    this.load.image("background-host", "assets/background.png");
    this.load.image("post-host", "assets/post.png");
    this.load.image("host", "assets/host.png");
    this.load.image("code", "assets/code.png");
    this.load.image("back-sign", "assets/options.png");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create() {
    const screen = this.add.container(0, 0);

    const background = this.add.image(960, 540, "background-host");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    const post = this.add.image(0, 0, "post-host");
    postContainer.add(post);

    const backContainer = this.add.container(350, -220);
    const backSign = this.add.image(0, 0, "back-sign");
    const backSignText = this.add.text(-250, 270, "Back", {
      fontFamily: "WBB",
      fontSize: 120,
      color: "#492807",
    });
    backContainer.add(backSign);
    backContainer.add(backSignText);

    const hostContainer = this.add.container(100, -240);
    const host = this.add.image(0, 0, "host");
    host.setDisplaySize(890, 290);
    const hostText = this.add.text(-180, -100, "Host", {
      fontFamily: "WBB",
      fontSize: 250,
      color: "#492807",
    });
    hostContainer.add(host);
    hostContainer.add(hostText);
    postContainer.add(hostContainer);

    const codeContainer = this.add.container(100, 80);
    const code = this.add.image(0, 0, "code");
    code.setDisplaySize(890, 290);
    code.setFlipX(true);
    const codeText = this.add.text(-150, -100, "Join", {
      fontFamily: "WBB",
      fontSize: 250,
      color: "#492807",
    });
    codeText.setRotation(-0.03);
    codeContainer.add(code);
    codeContainer.add(codeText);
    postContainer.add(codeContainer);


    backContainer.setInteractive(
      new Phaser.Geom.Rectangle(
        backSignText.x - 200,
        backSignText.y - 10,
        450,
        130
      ),
      Phaser.Geom.Rectangle.Contains
    );

    backContainer.on("pointerdown", () => {
      this.scene.start("MainScreen");
    });

    hostContainer.setInteractive(
      new Phaser.Geom.Rectangle(hostText.x - 240, hostText.y - 20, 840, 260),
      Phaser.Geom.Rectangle.Contains
    );

    hostContainer.on("pointerdown", () => {
      this.scene.start("HostRoom");
    });

    codeContainer.setInteractive(
      new Phaser.Geom.Rectangle(codeText.x - 260, codeText.y - 30, 840, 260),
      Phaser.Geom.Rectangle.Contains
    );

    codeContainer.on("pointerdown", () => {
      this.scene.start("JoinCode");
    });

    settingsListener(this);
  }
}





import { SocketService } from "../services/SocketService";

//JOIN

export class JoinCode extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;
  private codeText!: Phaser.GameObjects.Text;
  private typedCode: string = "";
  private socket = SocketService.getInstance();

  constructor() {
    super("JoinCode");
  }

  preload() {

    // this.socket = io("http://localhost:3000");
    this.load.image("background-code", "assets/background.png");
    this.load.image("post-code", "assets/post.png");
    this.load.image("host", "assets/host.png");
    this.load.image("code", "assets/code.png");
    this.load.image("back-sign", "assets/options.png");
    this.load.image("start-code", "assets/code.png");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create() {
    const screen = this.add.container(0, 0);

    const background = this.add.image(960, 540, "background-code");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    const post = this.add.image(0, 0, "post-code");
    postContainer.add(post);

    const backContainer = this.add.container(350, -220);
    const backSign = this.add.image(0, 0, "back-sign");
    const backSignText = this.add.text(-250, 270, "Back", {
      fontFamily: "WBB",
      fontSize: 120,
      color: "#492807",
    });
    backContainer.add(backSign);
    backContainer.add(backSignText);

    const hostContainer = this.add.container(100, -240);
    const host = this.add.image(0, 0, "host");
    host.setDisplaySize(890, 290);
    const hostText = this.add.text(-180, -100, "Code:", {
      fontFamily: "WBB",
      fontSize: 250,
      color: "#492807",
    });
    hostContainer.add(host);
    hostContainer.add(hostText);
    postContainer.add(hostContainer);

    const codeContainer = this.add.container(100, 80);
    const code = this.add.image(0, 0, "code");
    code.setDisplaySize(890, 290);
    code.setFlipX(true);
    const codeText = this.add.text(-360, -50, "_ _ _ _ _ _", {
      fontFamily: "WBB",
      fontSize: 150,
      color: "#492807",
    });
    codeText.setRotation(-0.03);
    codeContainer.add(code);
    codeContainer.add(codeText);
    postContainer.add(codeContainer);

    const startContainer = this.add.container(100, 80);
    const start = this.add.image(0, 250, "start-code");
    start.setDisplaySize(500, 200);
    const startText = this.add
      .text(-100, 180, "Join", {
        fontFamily: "WBB",
        fontSize: 150,
        color: "#492807",
      })
      .setRotation(0.03);
    startContainer.add(start);
    startContainer.add(startText);
    postContainer.add(startContainer);

    backContainer.setInteractive(
      new Phaser.Geom.Rectangle(
        backSignText.x - 200,
        backSignText.y - 10,
        450,
        130
      ),
      Phaser.Geom.Rectangle.Contains
    );

    backContainer.on("pointerdown", () => {
      this.scene.start("ConnectionMenu");
    });

    startContainer.setInteractive(
      new Phaser.Geom.Rectangle(startText.x - 150, startText.y - 20, 500, 180),
      Phaser.Geom.Rectangle.Contains
    );

    startContainer.on("pointerdown", () => {
      let gameId = prompt("Enter Game ID to Join:") || "";
      if (gameId.trim().length > 0) {
        this.socket.emit("joinLobby", gameId);
     
      } else {
        alert("Please enter a valid Game ID.");
      }
    });
    

    this.socket.on("joinedLobby", (data: { gameId: string; playerId: number }) => {
      this.scene.start("CharacterSelection", { gameId: data.gameId, playerId: data.playerId });
    });


settingsListener(this);
  }
}










// HOST
export class HostRoom extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;
  private lobby!: Phaser.GameObjects.Image;
  private playericon!: Phaser.GameObjects.Image;
  private gameCode!: Phaser.GameObjects.Text;

  private socket = SocketService.getInstance();
  private playerListText!: Phaser.GameObjects.Text;
  private gameStateText!: Phaser.GameObjects.Text;
  private playerId: number = 0;
  private pendingGameId: string | null = null;
  private pendingPlayerId: number | null = null;
  private selectedCharacterId: number | null = null;
  private selectedCharacterAsset: string | null = null;
  private joinInteractive!: Phaser.GameObjects.Graphics;
  private hasPickedCharacter: boolean = false;


  constructor() {
    super("HostRoom");
  }


  init(data: { gameId?: string; playerId?: number; selectedCharacterId?: number; selectedCharacterAsset?: string } = {}) {
    if (data.gameId) {
      this.pendingGameId = data.gameId;
    }
    if (data.playerId !== undefined) {
      this.pendingPlayerId = data.playerId;
      this.playerId = data.playerId;
      this.hasPickedCharacter = true;
    }
    if (data.selectedCharacterId) {
      this.selectedCharacterId = data.selectedCharacterId;
    }
    if (data.selectedCharacterAsset) {
      this.selectedCharacterAsset = data.selectedCharacterAsset;
    }
    console.log(`Initialized HostJoinWorkaround with data:`, data);

    
  }

  

  preload() {

    // Listen for server events
    this.socket.on("joinedLobby", (data: { gameId: string; playerId: number }) => {
      this.updateGameState()
      this.playerId = data.playerId;
      this.updateGameCode(data.gameId); // Update the game code display

      // Wait for 1 second to allow game state synchronization
      setTimeout(() => {
        console.log(`Switching to CharacterSelection scene after delay. Game ID: ${data.gameId}, Player ID: ${data.playerId}`);
        this.scene.start("CharacterSelection", { gameId: data.gameId, playerId: data.playerId });
      }, 1000);
    });

    this.socket.on("playerJoined", (data: { playerId: number }) => {
      this.updateGameState();
    });

    this.socket.on("error", (error) => {
      console.error("Error from server:", error);
    });

    this.socket.on("gameStarted", (data: { gameId: string, turnOrder: number[], currentPlayer: number }) => {
      console.log(`Game started with turn order: ${data.turnOrder}`);
      console.log(`${this.playerId}, ${data.currentPlayer}`);
      // Go to Guide scene instead of MapScene
      this.scene.start("Guide", { 
        gameId: data.gameId, 
        playerId: this.playerId, 
        currentPlayerTurn: data.currentPlayer,
        turnOrder: data.turnOrder
      });
    });

    // Handle gameId event, transition to CharacterSelection
    this.socket.on('gameId', (data: { gameId: string, playerId: number }) => {
      this.pendingGameId = data.gameId;
      this.pendingPlayerId = data.playerId;
      this.playerId = data.playerId;
      console.log(`Received gameId: ${data.gameId}, playerId: ${data.playerId}. Switching to CharacterSelection scene.`);
      // Transition to CharacterSelection scene, passing gameId and playerId
      this.scene.start('CharacterSelection', { gameId: data.gameId, playerId: data.playerId });
    });

    // const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    // this.load.setBaseURL(serverUrl);          
    // this.load.setPath('assets');   

    // this.load.image("background-room", "main_assets/background.png");
    // this.load.image("post-room", "main_assets/post.png");
    // this.load.image("host", "main_assets/host.png");
    // this.load.image("code", "main_assets/code.png");
    // this.load.image("back-sign", "main_assets/options.png");
    // this.load.image("start-room", "main_assets/host.png");
    // this.load.image("lobby", "main_assets/lobby.png");
    // this.load.svg("playericon", "main_assets/player icon.svg");

    this.load.image("background-room", "assets/background.png");
    this.load.image("post-room", "assets/post.png");
    this.load.image("host", "assets/host.png");
    this.load.image("code", "assets/code.png");
    this.load.image("back-sign", "assets/options.png");
    this.load.image("start-room", "assets/host.png");
    this.load.image("lobby", "assets/lobby.png");
    this.load.svg("playericon", "assets/player icon.svg");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create() {
    
    const screen = this.add.container(0, 0);

    const background = this.add.image(960, 540, "background-room");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    postContainer.setPosition(400, 620);
    const post = this.add.image(0, 0, "post-room");
    postContainer.add(post);

    const backContainer = this.add.container(350, -220);
    const backSign = this.add.image(0, 0, "back-sign");
    const backSignText = this.add.text(-250, 270, "Back", {
      fontFamily: "WBB",
      fontSize: 120,
      color: "#492807",
    });
    backContainer.add(backSign);
    backContainer.add(backSignText);

    const hostContainer = this.add.container(100, -240);
    const host = this.add.image(0, 0, "host");
    host.setDisplaySize(890, 290);
    const hostText = this.add.text(-180, -100, "Code:", {
      fontFamily: "WBB",
      fontSize: 250,
      color: "#492807",
    });
    hostContainer.add(host);
    hostContainer.add(hostText);
    postContainer.add(hostContainer);

    const codeContainer = this.add.container(100, 80);
    const code = this.add.image(0, 0, "code");
    code.setDisplaySize(890, 290);
    code.setFlipX(true);
    this.gameCode = this.add.text(-210, -90, "", {
      fontFamily: "WBB",
      fontSize: 210,
      color: "#492807",
    });
    this.gameCode.setRotation(-0.03);
    // this.socket.on('gameId', (gameId) => {
    //   this.updateGameCode(gameId);
    // });
  
    codeContainer.add(code);
    codeContainer.add(this.gameCode);
    postContainer.add(codeContainer);

    const startContainer = this.add.container(100, 80);
    const start = this.add.image(0, 250, "start-room");
    start.setDisplaySize(500, 200);
    const startText = this.add
      .text(-100, 180, "Host", {
        fontFamily: "WBB",
        fontSize: 150,
        color: "#492807",
      })
      .setRotation(0.03);
    startContainer.add(start);
    startContainer.add(startText);
    postContainer.add(startContainer);
    this.joinInteractive = this.add.graphics();
    this.joinInteractive.fillRect(260, 850, 460, 200);
    this.joinInteractive.setInteractive(new Phaser.Geom.Rectangle(260, 850, 460, 200), Phaser.Geom.Rectangle.Contains);
    this.joinInteractive.fillStyle(0x000000, 0);

    if (!this.hasPickedCharacter) {
      this.joinInteractive.on("pointerdown", () => {
        this.socket.emit("hostLobby");
      })
    } else {
      startText.setText("Start");
      this.joinInteractive.on("pointerdown", () => {
        const gameId = this.gameCode.text.trim();
        if (gameId && gameId !== "Game Code:") {
          this.socket.emit("startGame", gameId);
        } else {
          alert("No Game ID to start!");
        }
      })
    }
    const lobbyContainer = this.add.container(0, 0);
    const lobby = this.add.image(1400, 650, "lobby");
    lobby.setDisplaySize(650, 750);
    const lobbyText = this.add.text(1260, 340, "Wanted", {
      fontFamily: "WBB",
      fontSize: 130,
      color: "#492807",
    });
    lobbyContainer.add(lobby);
    lobbyContainer.add(lobbyText);

    this.playerIconContainer = this.add.container(0, 0);
    this.add.existing(this.playerIconContainer);

    backContainer.setInteractive(
      new Phaser.Geom.Rectangle(
        backSignText.x - 200,
        backSignText.y - 10,
        450,
        130
      ),
      Phaser.Geom.Rectangle.Contains
    );

    backContainer.on("pointerdown", () => {
      this.scene.start("ConnectionMenu");
    });


    // Apply pending data if any
    if (this.pendingGameId) {
      this.updateGameCode(this.pendingGameId);
      if (this.pendingPlayerId !== null) {
        this.playerId = this.pendingPlayerId;
      }
      this.pendingGameId = null;
      this.pendingPlayerId = null;
    }

    // Display selected character if returning from CharacterSelection
    if (this.selectedCharacterId) {
      console.log(`Character selected with asset: ${this.selectedCharacterAsset}`);
    }

    settingsListener(this);

  }
  private playerIconContainer!: Phaser.GameObjects.Container;
  private playerCount = 1;
  private playerIconsX = 1270
  private playerIconsY = 550
  private playerIconsSecondY = 550
  private increasePlayerCount() {
    if (this.playerCount <= 3) {
      this.addPlayerIcon(this.playerIconsX, this.playerIconsY, `P${this.playerCount}`)
      this.playerIconsY += 160
    } else {
      this.addPlayerIcon(this.playerIconsX, this.playerIconsSecondY, `P${this.playerCount}`)
      this.playerIconsSecondY +=160
    }
    this.playerCount++
  }

  private addPlayerIcon(x: number, y: number, playerId: string) {
    
    const playerIcon = this.add.image(x, y, "playericon");
    const playerText = this.add.text(x - 25, y + 50, playerId, {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
  
    this.playerIconContainer.add(playerIcon);
    this.playerIconContainer.add(playerText);

  }

  private updateGameCode(gameId: string) {
    if (!this.gameCode) {
      console.warn('Game code text object is not initialized yet. Update delayed to create().');
      return;
    }
    this.gameCode.setText(gameId ? `${gameId}` : "Game Code:\n");
    this.gameCode.setInteractive();
    this.gameCode.on('pointerdown', () => {
      // Double-click to copy
      const lastClick = this.gameCode.getData('lastClickTime') || 0;
      if (this.time.now - lastClick < 300) { // 300ms for double-click detection
        navigator.clipboard.writeText(gameId)
          .then(() => {
            console.log(`Game code ${gameId} copied to clipboard`);
            // Optional: Visual feedback
            const originalColor = this.gameCode.style.color;
            this.gameCode.setStyle({ color: '#00ff00' });
            this.time.delayedCall(500, () => {
              this.gameCode.setStyle({ color: originalColor });
            }, [], this);
          })
          .catch(err => {
            console.error('Failed to copy game code to clipboard:', err);
          });
      }
      this.gameCode.setData('lastClickTime', this.time.now);
    });
  }

  private updateGameState() {
    this.increasePlayerCount()
  }

}

export class Guide extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private paper!: Phaser.GameObjects.Image;
  private rulebookTexts!: {
    index: number;
    label: string;
    description: string;
  }[];

  constructor() {
    super("Guide");

    this.rulebookTexts = [
      {
        index: 1,
        label: "Safe Tile",
        description: "This tile is a safe space. Gain +3 gold!",
      },
      {
        index: 2,
        label: "Decision Tile",
        description:
          "This tile unlocks cool dialogue and determines your path moving forward.",
      },
      {
        index: 3,
        label: "Mining Tile",
        description:
          "This tile grants player a random amount of gold between 10–30.",
      },
      {
        index: 4,
        label: "Event Tile",
        description:
          "This tile unlocks cool events that may grant rewards and lore.",
      },
      {
        index: 5,
        label: "Treasure Tile",
        description: "This tile gives player a random one-time use item.",
      },
      {
        index: 6,
        label: "Effect Tile",
        description: "This tile grants player a random one-time combat buff.",
      },
      {
        index: 7,
        label: "Slots Tile",
        description:
          "This tile grants player a random amount of gold between 20–50.",
      },
      {
        index: 8,
        label: "Battle Tile",
        description: "You are ambushed by an enemy. Fight for your survival!",
      },
    ];
  }

  preload() {

  // - main_assets/lobby.png
  // - main_assets/code.png
  // - main_assets/quit.png
  // - main_assets/host.png
  // - main_assets/post.png
  // - main_assets/title card.png
  // - main_assets/pole.png
  // - main_assets/background.png
  // - main_assets/options.png
  // - main_assets/player icon.svg
  // - main_assets/start.png

    // this.load.image("background-guide", "assets/background.png");
    // this.load.image("paper-one", "assets/lobby.png");
    // this.load.image("paper-two", "assets/pagePinned.png");
    // this.load.image("paper-three", "assets/pagePinned.png");
    // this.load.image("okay", "assets/options.png");
    // this.load.svg("battle", "assets/battle.svg");
    // this.load.svg("decision", "assets/decision.svg");
    // this.load.svg("effect", "assets/effect.svg");
    // this.load.svg("event", "assets/event.svg");
    // this.load.svg("mining", "assets/mining.svg");
    // this.load.svg("safe", "assets/safe.svg");
    // this.load.svg("slots", "assets/slots.svg");
    // this.load.svg("treasure", "assets/treasure.svg");
    // load locally
    this.load.image("background-guide", "assets/background.png");
    this.load.image("paper-one", "tempAssets/settingsOverlay/page.png");
    this.load.image("paper-two", "tempAssets/settingsOverlay/pagePinned.png");
    this.load.image("paper-three", "tempAssets/settingsOverlay/pagePinned.png");
    this.load.image("okay", "assets/options.png");
    this.load.svg("battle", "tempAssets/tiles/battle.svg");
    this.load.svg("decision", "tempAssets/tiles/decision.svg");
    this.load.svg("effect", "tempAssets/tiles/effect.svg");
    this.load.svg("event", "tempAssets/tiles/event.svg");
    this.load.svg("mining", "tempAssets/tiles/mining.svg");
    this.load.svg("safe", "tempAssets/tiles/safe.svg");
    this.load.svg("slots", "tempAssets/tiles/slots.svg");
    this.load.svg("treasure", "tempAssets/tiles/treasure.svg");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create(data: { gameId: string, playerId: number, currentPlayerTurn: number, turnOrder: number[] }) {
    const screen = this.add.container(0, 0);
    const background = this.add.image(960, 540, "background-guide");
    screen.add(background);

    const paperOneContainer = this.add.container(350, 450);
    const paperOne = this.add.image(0, 0, "paper-one");
    paperOne.setDisplaySize(550, 650);
    const paperOneText = this.add.text(-140, -150, "Tiles\n Guide", {
      fontFamily: "WBB",
      fontSize: 150,
      color: "#492807",
    });
    paperOneContainer.add([paperOne, paperOneText]);

    const paperTwoContainer = this.add.container(970, 450);
    const paperTwo = this.add.image(0, 0, "paper-two");
    paperTwo.setDisplaySize(550, 650);
    const paperTwoLabel1 = this.add.text(
      -120,
      -180,
      this.rulebookTexts[0].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperTwoDescription1 = this.add.text(
      -120,
      -130,
      this.rulebookTexts[0].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperTwo.displayWidth * 0.6 },
      }
    );

    const safe = this.add.image(-170, -140, "safe").setDisplaySize(90, 90);

    const paperTwoLabel2 = this.add.text(
      -120,
      -80,
      this.rulebookTexts[1].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperTwoDescription2 = this.add.text(
      -120,
      -30,
      this.rulebookTexts[1].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperTwo.displayWidth * 0.6 },
      }
    );

    const decision = this.add
      .image(-170, -30, "decision")
      .setDisplaySize(90, 90);

    const paperTwoLabel3 = this.add.text(
      -120,
      30,
      this.rulebookTexts[2].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperTwoDescription3 = this.add.text(
      -120,
      80,
      this.rulebookTexts[2].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperTwo.displayWidth * 0.6 },
      }
    );

    const mining = this.add.image(-170, 80, "mining").setDisplaySize(90, 90);

    const paperTwoLabel4 = this.add.text(
      -120,
      140,
      this.rulebookTexts[3].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperTwoDescription4 = this.add.text(
      -120,
      190,
      this.rulebookTexts[3].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperTwo.displayWidth * 0.6 },
      }
    );

    const event = this.add.image(-170, 190, "event").setDisplaySize(90, 90);

    paperTwoContainer.add([
      paperTwo,
      paperTwoLabel1,
      paperTwoDescription1,
      paperTwoLabel2,
      paperTwoDescription2,
      paperTwoLabel3,
      paperTwoDescription3,
      paperTwoLabel4,
      paperTwoDescription4,
      safe,
      decision,
      mining,
      event,
    ]);

    const paperThreeContainer = this.add.container(1590, 450);
    const paperThree = this.add.image(0, 0, "paper-three");
    paperThree.setDisplaySize(550, 650);
    const paperThreeLabel5 = this.add.text(
      -120,
      -180,
      this.rulebookTexts[4].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperThreeDescription5 = this.add.text(
      -120,
      -130,
      this.rulebookTexts[4].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperThree.displayWidth * 0.6 },
      }
    );

    const treasure = this.add
      .image(-170, -130, "treasure")
      .setDisplaySize(90, 90);

    const paperThreeLabel6 = this.add.text(
      -120,
      -70,
      this.rulebookTexts[5].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperThreeDescription6 = this.add.text(
      -120,
      -20,
      this.rulebookTexts[5].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperThree.displayWidth * 0.6 },
      }
    );

    const effect = this.add.image(-170, -20, "effect").setDisplaySize(90, 90);

    const paperThreeLabel7 = this.add.text(
      -120,
      40,
      this.rulebookTexts[6].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperThreeDescription7 = this.add.text(
      -120,
      90,
      this.rulebookTexts[6].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperThree.displayWidth * 0.6 },
      }
    );

    const slots = this.add.image(-180, 80, "slots").setDisplaySize(100, 70);

    const paperThreeLabel8 = this.add.text(
      -120,
      150,
      this.rulebookTexts[7].label,
      {
        fontFamily: "Wellfleet",
        fontSize: 32,
        color: "#462406",
        align: "center",
      }
    );

    const paperThreeDescription8 = this.add.text(
      -120,
      200,
      this.rulebookTexts[7].description,
      {
        fontFamily: "Wellfleet",
        fontSize: 16,
        color: "#462406",
        align: "center",
        wordWrap: { width: paperThree.displayWidth * 0.6 },
      }
    );

    const battle = this.add.image(-170, 200, "battle").setDisplaySize(90, 90);

    paperThreeContainer.add([
      paperThree,
      paperThreeLabel5,
      paperThreeDescription5,
      paperThreeLabel6,
      paperThreeDescription6,
      paperThreeLabel7,
      paperThreeDescription7,
      paperThreeLabel8,
      paperThreeDescription8,
      treasure,
      effect,
      slots,
      battle,
    ]);

    const okayContainer = this.add.container(960, 540);
    const okay = this.add.image(900, 150, "okay");
    okay.setDisplaySize(1000, 900);

    const okayText = this.add.text(650, 370, "Okay", {
      fontFamily: "WBB",
      fontSize: 100,
      color: "#492807",
    });
    okayContainer.add([okay, okayText]);

    okayContainer.setInteractive(
      new Phaser.Geom.Rectangle(okayText.x - 100, okayText.y - 10, 350, 120),
      Phaser.Geom.Rectangle.Contains
    );

    okayContainer.on("pointerdown", () => {
      this.scene.start("MapScene", {
        gameId: data.gameId,
        playerId: data.playerId,
        currentPlayerTurn: data.currentPlayerTurn,
        turnOrder: data.turnOrder
      });
    });
  }
}