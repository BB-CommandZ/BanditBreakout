import Player from "./Player"
import Map from "../Map/Map"
import Settings from "./Settings";

export default class Game {
    players: Player[]
    map: Map
    settings: Settings
    initialRolls: { playerId: number, roll: number }[] = [];
    turnOrder: number[] = [];
    currentTurnIndex: number = 0;
    game_id: string

    constructor(game_id: string) {
        this.players = []
        this.map = new Map()
        this.settings = new Settings()
        this.game_id = game_id
    }

    public addPlayer(): void {
       if (this.players.length < 5) {
        this.players.push(new Player(this, this.players.length + 1))
        console.log(`Player ${this.players.length} added!`)
       } else {
        console.log("Max players reached!")
       }
    }
    

    public startGame(): void {
        console.log("Game started!")
        // create players
        // TODO
        // for (let player = 1; player <= playerCount; player++) {
        //     this.players.push(new Player(this, player))
        // }
        
        // create map

        this.map.initializeMap(this.players.length)
    }


    public rollForTurnOrder(playerId: number): number {
        const roll = Math.floor(Math.random() * 6) + 1; // Simulate dice roll 1-6
        this.initialRolls.push({ playerId, roll });
        console.log(`Player ${playerId} rolled a ${roll} for turn order`);
        return roll;
    }

    public determineTurnOrder(): number[] {
        // Sort by roll descending
        const sortedRolls = this.initialRolls.sort((a, b) => b.roll - a.roll);
        const turnOrder: number[] = [];
        const usedIds = new Set<number>();
        
        if (sortedRolls.length === 0) {
            return turnOrder;
        }
        
        // Handle ties by randomizing order among tied players
        let currentRoll = sortedRolls[0].roll;
        let tiedPlayers: number[] = [];
        
        for (const { playerId, roll } of sortedRolls) {
            if (roll === currentRoll) {
                tiedPlayers.push(playerId);
            } else {
                // Shuffle tied players and add to turn order
                for (let i = tiedPlayers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [tiedPlayers[i], tiedPlayers[j]] = [tiedPlayers[j], tiedPlayers[i]];
                }
                turnOrder.push(...tiedPlayers.filter(id => !usedIds.has(id)));
                usedIds.add(...tiedPlayers);
                tiedPlayers = [playerId];
                currentRoll = roll;
            }
        }
        // Handle the last group of tied players
        if (tiedPlayers.length > 0) {
            for (let i = tiedPlayers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tiedPlayers[i], tiedPlayers[j]] = [tiedPlayers[j], tiedPlayers[i]];
            }
            turnOrder.push(...tiedPlayers.filter(id => !usedIds.has(id)));
        }
        
        this.turnOrder = turnOrder;
        console.log(`Turn order determined: ${turnOrder}`);
        return turnOrder;
    }
    
    public getCurrentPlayerTurn(): number {
        if (this.turnOrder.length === 0 || this.currentTurnIndex >= this.turnOrder.length) {
            return -1;
        }
        return this.turnOrder[this.currentTurnIndex];
    }
    
    public advanceTurn(): number {
        if (this.turnOrder.length === 0) {
            return -1;
        }
        this.currentTurnIndex++;
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.currentTurnIndex = 0;
        }
        console.log(`Turn advanced to player ${this.turnOrder[this.currentTurnIndex]}`);
        console.log(`${this.turnOrder.length}`);
        console.log(`${this.turnOrder}`);
        return this.turnOrder[this.currentTurnIndex];
    }
}
