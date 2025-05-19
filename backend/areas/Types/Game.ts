import Player from "./Player"
import Map from "../Map/Map"
import Settings from "./Settings";
import Battle from "./Battle";
import NPC from "./Npc"; // Import NPC

export default class Game {
    players: Player[]
    map: Map
    settings: Settings
    game_id: string
    initialRolls: { playerId: number, roll: number }[] = [];
    turnOrder: number[] = [];
    currentTurnIndex: number = 0;
    currentBattle: Battle | null = null;
    public io: any; // Changed visibility to public


    constructor(game_id: string, io: any) { // Added io parameter
        this.game_id = game_id; // Moved game_id assignment up
        this.io = io; // Store the io instance
        this.players = []
        this.map = new Map()
        this.settings = new Settings()
        this.game_id = game_id
    }

    public addPlayer(): void {
       if (this.players.length < 5) {
        const playerId = this.players.length + 1;
        this.players.push(new Player(this, playerId));
        this.rollForTurnOrder(playerId);
        console.log(`Player ${this.players.length} added!`)
       } else {
        console.log("Max players reached!")
       }
    }


    public startGame(): void {
        console.log("Game started!")


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
                const uniqueTiedPlayers = tiedPlayers.filter(id => !usedIds.has(id));
                turnOrder.push(...uniqueTiedPlayers);
                uniqueTiedPlayers.forEach(id => usedIds.add(id));
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
            const uniqueTiedPlayers = tiedPlayers.filter(id => !usedIds.has(id));
            turnOrder.push(...uniqueTiedPlayers);
            uniqueTiedPlayers.forEach(id => usedIds.add(id));
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

    // New method to start a battle
    public async startBattle(player1: Player, opponent: Player | NPC, context?: any): Promise<{ winner?: Player | NPC, loser?: Player | NPC }> {
        console.log(`Initiating battle between ${player1.nameOrCharacter()} and ${opponent.nameOrCharacter()}`);

        // Emit initiateBattle event to frontend
        this.io.to(this.game_id).emit('initiateBattle', {
            player1Id: player1.id,
            opponentId: opponent instanceof Player ? opponent.id : opponent.id, // Assuming NPC also has an id
            player1Health: player1.getHealth(),
            opponentHealth: opponent instanceof Player ? opponent.getHealth() : opponent.health, // Assuming NPC has a health property
            isNPCBattle: !(opponent instanceof Player),
            // Add other relevant initial battle state data
        });

        this.currentBattle = new Battle(player1, opponent, this); // Create a new Battle instance
        const result = await this.currentBattle.initiateBattle(context); // Initiate the battle
        this.currentBattle = null; // Clear the current battle after it ends

        // TODO: Emit battleResult event here after the battle concludes

        return result;
    }

    // Method to create NPCs (moved from Battle.ts)
    public createNPC(npcId: string): NPC | undefined {
        if (npcId === 'Wim_Battle') {
            return new NPC({
                id: 'Wim_Battle',
                name: 'Wim (Ambusher)',
                health: 10,
                maxHealth: 10,
                goldDrop: 3,
                itemDropChance: 0.005, // 0.5%
                aiBehavior: (self, targetPlayer, gameInstance) => {
                    // Call methods on the Battle instance instead of gameInstance
                    // This logic might need to be adapted to fit the Game class context
                    // For now, a placeholder or direct attack
                    const attackRoll = Math.floor(Math.random() * 6) + 1; // Wim uses 1d6 for attack
                    console.log(`${self.name} attacks with a roll of ${attackRoll}!`);
                    // This needs to trigger an attack within the current battle
                    // This might require passing the battle instance or having a way to access it
                    // For now, just log the attack
                    console.log("NPC attack logic needs to be connected to the active battle.");
                }
            });
        }
        if (npcId === 'Spindle_Boss') {
            return new NPC({
                id: 'Spindle_Boss',
                name: 'Spindle, the Bandit King',
                health: 10, // Updated HP for testing
                maxHealth: 10, // Updated HP for testing
                aiBehavior: (self, targetPlayer, gameInstance) => {
                    // Call methods on the Battle instance instead of gameInstance
                    // This logic might need to be adapted to fit the Game class context
                    // For now, a placeholder or direct attack
                    const attackRoll = Math.floor(Math.random() * 6) + 1; // Spindle uses 1d6 for attack
                    console.log(`${self.name} attacks fiercely with a roll of ${attackRoll}!`);
                    // This needs to trigger an attack within the current battle
                    // This might require passing the battle instance or having a way to access it
                    // For now, just log the attack
                     console.log("NPC attack logic needs to be connected to the active battle.");
                }
            });
        }
        console.warn(`createNPC: Unknown NPC ID requested: ${npcId}`);
        return undefined;
    }


    // Method to check for a winner
    public getWinner(): Player | undefined {
        // Assuming the final tile is tile 102 based on Map.ts
        const finalTileIndex = 102; 
        for (const player of this.players) {
            const playerPosition = this.map.findPlayer(player.id);
            if (playerPosition === finalTileIndex) {
                // In a real game, you might also need to check if they defeated the boss
                // For now, just reaching the tile is considered winning for this method
                return player;
            }
        }
        return undefined; // No winner yet
    }

    // Method to set the winner of the game
    public setWinner(player: Player): void {
        console.log(`Player ${player.id} (${player.getCharacterName()}) is the winner!`);
        // In a real game, you would likely end the game here,
        // perhaps emit a 'gameOver' event with the winner's ID.
        // For now, we'll just log it.
        // TODO: Implement actual game over logic
    }
}
