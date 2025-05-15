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
    this.load.image("background", "assets/backDesert.png");
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

    const background = this.add.image(960, 540, "background");
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
    // doesnt work / works bad
    // let optionsInteractive = this.add.graphics();
    // optionsInteractive.fillStyle(0x000000, 0.5);
    // optionsInteractive.fillRect(350, 800, 600, 130);
    // optionsInteractive.setInteractive(new Phaser.Geom.Rectangle(350, 800, 600, 130), Phaser.Geom.Rectangle.Contains);
    // optionsInteractive.on("pointerdown", () => {
    //   this.scene.start("Settings", {previousSceneKey: this.scene.key});
    // });
    settingsListener(this);

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
    this.load.image("background", "assets/backDesert.png");
    this.load.image("post", "assets/post.png");
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

    const background = this.add.image(960, 540, "background");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    const post = this.add.image(0, 0, "post");
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
  }
}







//JOIN

export class JoinCode extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;
  private socket!: Socket;
  private codeText!: Phaser.GameObjects.Text;
  private typedCode: string = "";

  constructor() {
    super("JoinCode");
  }

  preload() {
    this.socket = io("http://localhost:3000");
    this.load.image("background", "assets/backDesert.png");
    this.load.image("post", "assets/post.png");
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

    const background = this.add.image(960, 540, "background");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    const post = this.add.image(0, 0, "post");
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
      const gameId = prompt("Enter Game ID to Join:");
      if (gameId && gameId.trim().length > 0) {
        console.log(`Emitting joinLobby with gameId: ${gameId.trim()}`);
        this.socket.emit("joinLobby", gameId.trim());
        this.scene.start("HostRoom", { gameId: gameId.trim() });
      } else {
        console.log("Invalid Game ID");
      }
    });


  //   this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
  //     this.handleTyping(event);
  //   });
  // }

  // private handleTyping(event: KeyboardEvent) {
  //   const key = event.key;

    
  //   if (/^[a-zA-Z0-9]$/.test(key) && this.typedCode.length < 6) {
  //     this.typedCode += key.toLowerCase();
  //   }

  //   if (key === "Backspace" && this.typedCode.length > 0) {
  //     this.typedCode = this.typedCode.slice(0, -1);
  //   }

  //   this.codeText.setText(this.typedCode || "_ _ _ _ _ _");
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

  private socket!: Socket;
  private gameCode!: Phaser.GameObjects.Text;
  private codeText!: Phaser.GameObjects.Text;
  private playerIconContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("HostRoom");
  }

  preload() {
    this.socket = io("http://localhost:3000");
    
    this.load.image("background", "assets/backDesert.png");
    this.load.image("post", "assets/post.png");
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

  create(data: { gameId?: string;}) {
    if (data.gameId) {
      console.log(`Received gameId in HostRoom: ${data.gameId}`);
      this.updateGameCode(data.gameId);
    } else {
      console.log("No gameId provided, emitting hostLobby");
      this.socket.emit("hostLobby");
    }
  
    this.socket.on("gameId", (gameId) => {
      console.log(`Received gameId from server: ${gameId}`);
      this.updateGameCode(gameId);
    });
  
    this.socket.on("joinedLobby", (data: { gameId: string; playerId: number }) => {
      console.log(`Player joined lobby: ${JSON.stringify(data)}`);
      this.increasePlayerCount();
    });
    
    const screen = this.add.container(0, 0);

    const background = this.add.image(960, 540, "background");
    screen.add(background);

    const postContainer = this.add.container(850, 620);
    postContainer.setPosition(400, 620);
    const post = this.add.image(0, 0, "post");
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
    this.codeText = this.add.text(-210, -90, "", {
      fontFamily: "WBB",
      fontSize: 210,
      color: "#492807",
    });
    this.codeText.setRotation(-0.03);
    this.socket.on('gameId', (gameId) => {
      this.updateGameCode(gameId);
    });
  
    codeContainer.add(code);
    codeContainer.add(this.codeText);
    postContainer.add(codeContainer);

    const startContainer = this.add.container(100, 80);
    const start = this.add.image(0, 250, "start-room");
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
    let joinInteractive = this.add.graphics();
    joinInteractive.fillStyle(0x000000, 0);
    joinInteractive.fillRect(260, 850, 460, 200);
    joinInteractive.setInteractive(new Phaser.Geom.Rectangle(260, 850, 460, 200), Phaser.Geom.Rectangle.Contains);
    joinInteractive.on("pointerdown", () => {
      this.scene.start("CharacterSelection");
    });

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
    this.increasePlayerCount()

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

  }
  
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
    this.codeText.setText(`${gameId.toUpperCase()}`);
  }
}
