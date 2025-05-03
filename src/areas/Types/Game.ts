import Player from "./Player"
import Map from "../Map/Map"
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

        // create players
        for (let player = 1; player <= playerCount; player++) {
            this.players.push(new Player(this, player))
        }
        
        // create map
        this.map.initializeMap(playerCount)

    }

    
    

}