import Player from "./Player"
import Map from "../Map/Map"
import Move from "./Movement"

export default class Game {
    players: Player[]
    map: Map
    sessionId: string = ''

    constructor() {
        console.log('Initializing Game...');
        this.players = [];
        try {
            console.log('Creating Map instance...');
            this.map = new Map();
            console.log('Map created successfully');
        } catch (err) {
            console.error('Failed to create Map:', err);
            throw err;
        }
    }
    
    public startGame(playerCount: number, sessionId: string): void {
        this.sessionId = sessionId;
        console.log("Game started!");
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
    public async movePlayerByDice(playerId: number): Promise<void> {
        const dice = this.rollDice();
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            console.log(`Player ${playerId} not found.`);
            return;
        }
        console.log(`Player ${playerId} rolled a ${dice}!`);
        await player.move.front(dice);

        const newTileIndex = this.map.findPlayer(playerId);
        if (newTileIndex === -1) {
            console.log(`Player ${playerId} not found on any tile after moving.`);
            return;
        }
        if (this.map.tiles[newTileIndex]) {
            await this.map.tiles[newTileIndex].getEvent().onStep(playerId, this);
        } else {
            console.error(`Error: Tile ${newTileIndex} does not exist on map.`);
        }
    }

    // Returns game state as JSON-serializable object
    public getSaveData(): object {
        return {
            sessionId: this.sessionId,
            players: this.players.map(p => ({
                id: p.id,
                position: this.map.findPlayer(p.id),
                gold: p.getGold(),
                inventory: p.inventory.getItems(),
                effects: p.status.getEffects()
            })),
            mapState: this.map.getSaveData()
        };
    }

    // Restores game state from saved data
    public loadFromSave(saveData: any): void {
        this.sessionId = saveData.sessionId;
        this.players = saveData.players.map((p: any) => {
            const player = new Player(this, p.id);
            player.setGold(p.gold);
            p.inventory.forEach((item: any) => player.inventory.addItem(item));
            p.effects.forEach((effect: any) => player.status.effectAdd(effect.name, effect.duration));
            return player;
        });
        this.map.loadFromSave(saveData.mapState);
    }
}
