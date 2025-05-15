import Player from "./Player";
import Map from "../Map/Map";
import Settings from "./Settings";
import Battle from "./Battle";

export default class Game {
  players: Player[];
  map: Map;
  settings: Settings;
  game_id: string;
  currentBattle: Battle | null = null;

  constructor(game_id: string) {
    this.players = [];
    this.map = new Map();
    this.settings = new Settings();
    this.game_id = game_id;
  }

  public addPlayer(): void {
    if (this.players.length < 5) {
      this.players.push(new Player(this, this.players.length + 1));
      console.log(`Player ${this.players.length} added!`);
    } else {
      console.log("Max players reached!");
    }
  }

  public startGame(): void {
    console.log("Game started!");

    // create map
    this.map.initializeMap(this.players.length);
  }
}
