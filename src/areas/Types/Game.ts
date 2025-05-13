import Player from "./Player";
import Map from "../Map/Map";
import Move from "./Movement";

export default class Game {
    players: Player[];
    map: Map;
    sessionId: string = '';
    private winner: Player | null = null;

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
        this.winner = null;
        console.log("Game started!");
        for (let player = 1; player <= playerCount; player++) {
            this.players.push(new Player(this, player, 10));
        }
        this.map.initializeMap(playerCount);
    }

    public rollDice(playerId: number): number {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`Player ${playerId} not found for dice roll`);
            return Math.floor(Math.random() * 6) + 1;
        }
        
        const riggedRoll = player.status.getNextDiceRoll();
        if (riggedRoll !== null && riggedRoll !== undefined) {
            console.log(`Using rigged dice roll of ${riggedRoll} for Player ${playerId}.`);
            player.status.effectRemove("rigged_dice_active");
            return riggedRoll;
        }
        return Math.floor(Math.random() * 6) + 1;
    }

    public async movePlayerByDice(playerId: number): Promise<void> {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.isAlive) {
            console.log(`Player ${playerId} not found or is not active.`);
            return;
        }
        if (player.status.isStunned()) {
            console.log(`Player ${player.id} is stunned and cannot roll or move!`);
            player.status.decrementEffectDurations();
            return;
        }

        const dice = this.rollDice(playerId);
        console.log(`Player ${playerId} rolled a ${dice}!`);
        player.status.setRemainingMoves(dice);

        await player.move.front(dice);

        if (this.winner) {
            return;
        }
    }

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

    public async loadFromSave(saveData: any): Promise<void> {
        this.sessionId = saveData.sessionId;
        for (const p of saveData.players) {
            const player = new Player(this, p.id);
            player.setGold(p.gold);
            for (const item of p.inventory) {
                await player.inventory.obtain(item.id);
            }
            for (const effect of p.effects) {
                player.status.effectAdd(effect.name, effect.duration);
            }
            this.players.push(player);
        }
        this.map.loadFromSave(saveData.mapState);
    }

    public setWinner(player: Player): void {
        if (!this.winner) {
            this.winner = player;
            console.log(`\n🎉🎉🎉 Player ${player.id} has won the game! 🎉🎉🎉`);
        }
    }

    public getWinner(): Player | null {
        return this.winner;
    }
}
