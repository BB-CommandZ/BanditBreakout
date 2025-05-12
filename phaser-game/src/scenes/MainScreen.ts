import { ok } from "assert";
import Phaser from "phaser";
import WebFontLoader from "webfontloader";

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
      this.scene.start("Host");
    });
  }
}

export class Host extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;

  constructor() {
    super("Host");
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
      this.scene.start("Room");
    });

    codeContainer.setInteractive(
      new Phaser.Geom.Rectangle(codeText.x - 260, codeText.y - 30, 840, 260),
      Phaser.Geom.Rectangle.Contains
    );

    codeContainer.on("pointerdown", () => {
      this.scene.start("Code");
    });
  }
}

export class Code extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;

  constructor() {
    super("Code");
  }

  preload() {
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
      this.scene.start("Host");
    });

    startContainer.setInteractive(
      new Phaser.Geom.Rectangle(startText.x - 150, startText.y - 20, 500, 180),
      Phaser.Geom.Rectangle.Contains
    );

    startContainer.on("pointerdown", () => {
      this.scene.start("Room");
    });
  }
}

export class Room extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private post!: Phaser.GameObjects.Image;
  private host!: Phaser.GameObjects.Image;
  private code!: Phaser.GameObjects.Image;
  private backSign!: Phaser.GameObjects.Image;
  private lobby!: Phaser.GameObjects.Image;
  private playericon!: Phaser.GameObjects.Image;

  constructor() {
    super("Room");
  }

  preload() {
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

    const playericonContainer = this.add.container(0, 0);

    const playericonContainter1 = this.add.container(0, 0);
    const playericon1 = this.add.image(1270, 550, "playericon");
    const playericon1Text = this.add.text(1245, 600, "P1", {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
    playericonContainter1.add(playericon1);
    playericonContainter1.add(playericon1Text);

    const playericonContainter2 = this.add.container(0, 0);
    const playericon2 = this.add.image(1270, 710, "playericon");
    const playericon2Text = this.add.text(1245, 760, "P2", {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
    playericonContainter2.add(playericon2);
    playericonContainter2.add(playericon2Text);

    const playericonContainter3 = this.add.container(0, 0);
    const playericon3 = this.add.image(1270, 870, "playericon");
    const playericon3Text = this.add.text(1245, 920, "P3", {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
    playericonContainter3.add(playericon3);
    playericonContainter3.add(playericon3Text);

    const playericonContainter4 = this.add.container(0, 0);
    const playericon4 = this.add.image(1500, 550, "playericon");
    const playericon4Text = this.add.text(1475, 600, "P4", {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
    playericonContainter4.add(playericon4);
    playericonContainter4.add(playericon4Text);

    const playericonContainter5 = this.add.container(0, 0);
    const playericon5 = this.add.image(1500, 710, "playericon");
    const playericon5Text = this.add.text(1475, 760, "P5", {
      fontFamily: "WBB",
      fontSize: 60,
      color: "#492807",
    });
    playericonContainter5.add(playericon5);
    playericonContainter5.add(playericon5Text);

    playericonContainer.add([
      playericonContainter1,
      playericonContainter2,
      playericonContainter3,
      playericonContainter4,
      playericonContainter5,
    ]);

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
      this.scene.start("Host");
    });
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
    this.load.image("background-guide", "assets/background.png");
    this.load.image("paper-one", "assets/lobby.png");
    this.load.image("paper-two", "assets/pagePinned.png");
    this.load.image("paper-three", "assets/pagePinned.png");
    this.load.image("okay", "assets/options.png");
    this.load.svg("battle", "assets/battle.svg");
    this.load.svg("decision", "assets/decision.svg");
    this.load.svg("effect", "assets/effect.svg");
    this.load.svg("event", "assets/event.svg");
    this.load.svg("mining", "assets/mining.svg");
    this.load.svg("safe", "assets/safe.svg");
    this.load.svg("slots", "assets/slots.svg");
    this.load.svg("treasure", "assets/treasure.svg");

    WebFontLoader.load({
      custom: {
        families: ["Wellfleet", "WBB"],
        urls: ["/fonts.css"],
      },
    });
  }

  create() {
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
      this.scene.start("CharacterSelection");
    });
  }
}
