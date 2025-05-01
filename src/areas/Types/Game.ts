import Player from "./Player"
import Map from "../Map/Map"
import Move from "./Movement"
import { Settings } from "../Types/Settings";

export default class Game {
    players: Player[]
    map: Map
    settings: Settings

    constructor() {
        this.players = []
        this.map = new Map()
        this.settings = new Settings()
    }
    
    public startGame(playerCount: number, game_id: string): void {
        console.log("Game started!")
        for (let player = 1; player <= playerCount; player++) {
            this.players.push(new Player(this, player))
        }
        this.map.initializeMap(playerCount)
    }

    // Rolls a dice (1-6)
    public rollDice(): number {
        return Math.floor(Math.random() * 6) + 1;
    }

    // Moves a player forward by a dice roll and triggers the tile event
    public movePlayerByDice(playerId: number): void {
        const dice = this.rollDice();
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            console.log(`Player ${playerId} not found.`);
            return;
        }
        console.log(`Player ${playerId} rolled a ${dice}!`);
        player.move.front(dice);

        const newTileIndex = this.map.findPlayer(playerId);
        if (newTileIndex === -1) {
            console.log(`Player ${playerId} not found on any tile after moving.`);
            return;
        }
        this.map.tiles[newTileIndex].getEvent().onStep(playerId, this);
    }
}
