import Player from "./Player";
import Map from "../Map/Map";
import Move from "./Movement";
import NPC from "./Npc"; // Import NPC
import prompts from 'prompts'; // Import prompts
import { ItemFactory, IBaseItem } from "./Item"; // Import ItemFactory and IBaseItem
import { Characters } from "./Character"; // Import Characters

interface BattleContext {
    isBossBattle?: boolean;
    initiator?: Player | NPC; // To determine who initiated the battle
}

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
    
    public async startGame(playerCount: number, sessionId: string): Promise<void> {
        this.sessionId = sessionId;
        this.winner = null;
        console.log("Game started!");
        for (let player = 1; player <= playerCount; player++) {
            this.players.push(new Player(this, player, 10)); // Create player with default gold and health
        }

        this.map.initializeMap(playerCount); // Initialize map before character selection

        // Assign Random Characters
        console.log("\n--- Assigning Random Characters ---");
        const playableCharacters = ["Grit", "Scout", "Solstice", "Buckshot", "Serpy"];
        const availableCharacterIds = Characters
            .filter(char => playableCharacters.includes(char.name))
            .map(char => char.id);

        for (const player of this.players) {
            if (availableCharacterIds.length > 0) {
                const randomCharacterId = availableCharacterIds[Math.floor(Math.random() * availableCharacterIds.length)];
                player.selectCharacter(randomCharacterId);
                console.log(`Player ${player.id} assigned character: ${player.getCharacterName()}`);
            } else {
                console.warn(`No playable characters available to assign for Player ${player.id}.`);
            }
        }
        console.log("--- Random Character Assignment Complete ---\n");

        // Determine initial turn order by dice roll
        console.log("--- Determining Turn Order ---");
        const initialRolls: { playerId: number, roll: number }[] = [];
        for (const player of this.players) {
            const roll = this.rollDice(player.id); // Use the existing rollDice method
            console.log(`Player ${player.id} (${player.getCharacterName()}) rolled a ${roll} for turn order.`);
            initialRolls.push({ playerId: player.id, roll: roll });
        }

        // Sort players based on initial roll (highest first)
        initialRolls.sort((a, b) => b.roll - a.roll);
        this.players = initialRolls.map(roll => this.players.find(p => p.id === roll.playerId)!);

        console.log("\n--- Initial Player Status ---");
        for (const player of this.players) {
            console.log(`Player ${player.id} (${player.getCharacterName()}):`);
            console.log(`  Position: ${this.map.findPlayer(player.id)}`);
            console.log(`  Gold: ${player.getGold()}`);
            console.log(`  Health: ${player.getHealth()}`);
            console.log(`  Items: ${player.inventory.getItems().map(item => item.name).join(', ') || 'None'}`);
            console.log(`  Battle Effects: ${Array.from(player.status.activeBattleEffects).join(', ') || 'None'}`);
        }
        console.log("---------------------------\n");

        // TODO: Call method to start the main game turn loop
        console.log("Game initialization complete. Ready to start turns.");
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

    // New method for battle dice rolls
    public rollBattleDice(sides: number = 6): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    // New method to perform an attack
    public performAttack(attacker: Player | NPC, defender: Player | NPC, attackRollValue: number): void {
        let damageDealt = attackRollValue;

        // Apply Revolver battle effect if attacker is player and has it
        if (attacker instanceof Player && attacker.status.hasBattleEffect('Revolver')) {
            damageDealt += 1;
            console.log(`${attacker.getCharacterName()} uses Revolver effect, adding +1 to attack!`);
        }

        // Apply Sunscreen battle effect if defender is player and has it
        if (defender instanceof Player && defender.status.hasBattleEffect('Sunscreen')) {
            damageDealt = Math.max(0, damageDealt - 1); // Reduce damage by 1, to a minimum of 0
            console.log(`${defender.getCharacterName()} uses Sunscreen effect, reducing damage by 1!`);
        }

        // If defender is a Player and is defending in PvP
        if (defender instanceof Player && defender.status.isDefending && defender.status.shield > 0) {
            if (damageDealt >= defender.status.shield) {
                console.log(`${defender.getCharacterName()}'s shield (${defender.status.shield}) breaks!`);
                damageDealt -= defender.status.shield;
                defender.status.shield = 0;
            } else {
                defender.status.shield -= damageDealt;
                console.log(`${defender.getCharacterName()}'s shield absorbs ${damageDealt} damage. Shield remaining: ${defender.status.shield}`);
                damageDealt = 0;
            }
        }

        defender.setHealth(defender.getHealth() - damageDealt); // Use setHealth for consistency
        console.log(`${attacker.nameOrCharacter()} deals ${damageDealt} damage to ${defender.nameOrCharacter()}.`);
    }

    // New method to initiate and manage a battle
    public async initiateBattle(player1: Player, opponent: Player | NPC, context?: BattleContext): Promise<{ winner?: Player | NPC, loser?: Player | NPC }> {
        const opponentIsPlayer = opponent instanceof Player;
        let attacker: Player | NPC, defender: Player | NPC;

        console.log(`\n--- Battle Initiated: ${player1.nameOrCharacter()} vs ${opponent.nameOrCharacter()} ---`);
        console.log(`Initial HP: ${player1.nameOrCharacter()}: ${player1.getHealth()}, ${opponent.nameOrCharacter()}: ${opponent.getHealth()}`);

        // --- Apply Food/Cactus HP adjustments at the start of battle ---
        if (player1.status.hasBattleEffect('Food')) {
            player1.setHealth(player1.getHealth() + 2);
            console.log(`${player1.getCharacterName()} uses Food effect, starting with +2 HP! Current HP: ${player1.getHealth()}`);
        }
        if (player1.status.hasBattleEffect('Cactus')) {
            player1.setHealth(Math.max(1, player1.getHealth() - 2)); // Not below 1 HP
            console.log(`${player1.getCharacterName()} is affected by Cactus, starting with -2 HP! Current HP: ${player1.getHealth()}`);
        }
        // Similar checks if opponent is also a Player and can have these effects (assuming NPCs don't have battle effects for now)

        // --- Determine Turn Order ---
        const p1Boots = player1.status.hasBattleEffect('Cowboy_Boots');
        const oppBoots = (opponent instanceof Player && opponent.status.hasBattleEffect('Cowboy_Boots'));

        let p1GoesFirst: boolean;
        if (p1Boots && !oppBoots) {
            p1GoesFirst = true;
            console.log(`${player1.getCharacterName()} has Cowboy Boots and attacks first!`);
        } else if (!p1Boots && oppBoots) {
            p1GoesFirst = false;
            console.log(`${opponent.nameOrCharacter()} has Cowboy Boots and attacks first!`);
        } else { // Both have boots OR Neither has boots
            if (p1Boots && oppBoots) console.log("Both combatants have Cowboy Boots! Turn order is random.");
            else console.log("No Cowboy Boots active for turn priority. Turn order is random.");
            p1GoesFirst = Math.random() < 0.5;
        }

        if (p1GoesFirst) {
            attacker = player1; defender = opponent;
        } else {
            attacker = opponent; defender = player1;
        }
        if (attacker instanceof Player) console.log(`${attacker.getCharacterName()} will go first.`);
        else console.log(`${attacker.name} (NPC) will go first.`);


        while (player1.getHealth() > 0 && opponent.getHealth() > 0) {
            console.log(`\n--- ${attacker.nameOrCharacter()}'s Turn ---`);
            // Reset shield if attacker had defended in their previous turn
            if (attacker instanceof Player && attacker.status.isDefending) {
                console.log(`${attacker.getCharacterName()}'s shield from last turn fades.`);
                attacker.status.shield = 0;
                attacker.status.isDefending = false;
            }

            console.log(`${player1.nameOrCharacter()} HP: ${player1.getHealth()} (Shield: ${player1.status.shield || 0}), ${opponent.nameOrCharacter()} HP: ${opponent.getHealth()} (Shield: ${opponent instanceof Player ? opponent.status.shield || 0 : 0})`);

            let actionChoice;
            if (attacker instanceof Player) {
                const choices = [{ title: 'Attack', value: 'attack' }];
                // Allow Defend in all battles (PvP and PvE)
                choices.push({ title: 'Defend', value: 'defend' });
                // TODO: Add "Use Item" choice if applicable

                actionChoice = await prompts({
                    type: 'select',
                    name: 'value',
                    message: `${attacker.getCharacterName()}, choose your action:`,
                    choices: choices
                });

                if (actionChoice.value === 'attack') {
                    const attackRoll = this.rollBattleDice(6); // Player's attack roll (1d6)
                    console.log(`${attacker.getCharacterName()} chooses to Attack with a roll of ${attackRoll}!`);
                    this.performAttack(attacker, defender, attackRoll);
                } else if (actionChoice.value === 'defend' && opponentIsPlayer) {
                    const defendRoll = this.rollBattleDice(6); // Player's defend roll (1d6)
                    attacker.status.shield = defendRoll;
                    attacker.status.isDefending = true; // Mark that they are defending this turn
                    console.log(`${attacker.getCharacterName()} chooses to Defend, gaining ${defendRoll} shield for this round!`);
                } // else if (actionChoice.value === 'item') { /* ... item logic ... */ }

            } else { // NPC's turn (Wim or Spindle)
                attacker.aiBehavior(attacker, defender as Player, this); // NPC AI targets the player
            }

            // Check for defeat
            if (defender.getHealth() <= 0) {
                console.log(`\n${defender.nameOrCharacter()} has been defeated!`);

                // --- Consume Battle Effects ---
                player1.status.consumeAllBattleEffects();
                console.log(`${player1.getCharacterName()}'s battle effects have worn off.`);
                if (opponent instanceof Player) {
                    opponent.status.consumeAllBattleEffects();
                    console.log(`${opponent.getCharacterName()}'s battle effects have worn off.`);
                }

                // --- Handle Win/Loss Consequences ---
                // PvP Win Condition
                if (opponentIsPlayer && attacker instanceof Player) {
                    const victor = attacker as Player;
                    const defeated = defender as Player;
                    console.log(`${victor.getCharacterName()} wins the PvP battle!`);

                    // Steal logic (attacker is victor)
                    const stealChoice = await prompts({
                        type: 'select',
                        name: 'value',
                        message: `${victor.getCharacterName()}, choose your reward:`,
                        choices: [
                            { title: 'Steal 3 Gold', value: 'gold' },
                            { title: 'Steal 1 Item (if available)', value: 'item', disabled: defeated.inventory.items.length === 0 }
                        ]
                    });
                    if (stealChoice.value === 'gold') {
                        const goldStolen = Math.min(defeated.getGold(), 3); // Use getGold
                        victor.setGold(victor.getGold() + goldStolen); // Use setGold
                        defeated.setGold(defeated.getGold() - goldStolen); // Use setGold
                        console.log(`${victor.getCharacterName()} steals ${goldStolen} gold from ${defeated.getCharacterName()}.`);
                    } else if (stealChoice.value === 'item' && defeated.inventory.items.length > 0) {
                        const itemStolen = defeated.inventory.removeRandomItem(); // Use the new method
                        if (itemStolen) {
                            victor.inventory.addItem(itemStolen); // Use the new method
                            console.log(`${victor.getCharacterName()} steals ${itemStolen.name} from ${defeated.getCharacterName()}.`);
                    }
                }

                // PvP Defeat Specifics
                defeated.setHealth(defeated.maxHealth); // Reset HP to max
                console.log(`${defeated.getCharacterName()}'s HP is restored to ${defeated.maxHealth}.`);
                await defeated.move.back(2); // Move loser back 2 tiles
                console.log(`${defeated.getCharacterName()} is moved back 2 tiles.`);

            }
            // PvNPC (Wim) Win Condition
                else if (defender instanceof NPC && attacker instanceof Player) {
                     console.log(`${attacker.getCharacterName()} defeated ${defender.name}!`);
                     if (defender.id === 'Wim_Battle') {
                         if (defender.goldDrop) {
                             attacker.setGold(attacker.getGold() + defender.goldDrop); // Use setGold
                             console.log(`You looted ${defender.goldDrop} gold.`);
                         }
                         if (defender.itemDropChance && Math.random() < defender.itemDropChance) {
                             // Get a less expensive shop item
                             const lessExpensiveItemIds = [0, 3, 6, 7, 8]; // Lasso, Poison Crossbow, Rigged Dice, V.S. Item, Tumbleweed
                             const randomItemId = lessExpensiveItemIds[Math.floor(Math.random() * lessExpensiveItemIds.length)];
                             const droppedItem = ItemFactory.createItem(randomItemId, attacker);
                             if (droppedItem) {
                                 attacker.inventory.addItem(droppedItem); // Use the new method
                                 console.log(`You found a rare item: ${droppedItem.name}!`);
                             } else {
                                 console.log("You found an item, but there was an issue creating it.");
                             }
                         }
                     }
                     // Spindle win is handled by BossBattleEvent
                }
                // Player Lost to NPC (Wim/Spindle)
                else if (attacker instanceof NPC && defender instanceof Player) {
                     console.log(`${defender.getCharacterName()} was defeated by ${attacker.name}.`);
                     if (!context?.isBossBattle) { // Wim loss
                        await defender.handleBattleLoss(this, { moveBackTiles: 2, goldLoss: 3, itemLossCount: 1 }); // Use the new method
                     } else { // Spindle loss (BossBattleEvent handles the move back, gold/item loss)
                        console.log("You have been defeated by Spindle!"); // BossBattleEvent will manage consequences
                     }
                }
                return { winner: attacker, loser: defender }; // Battle ends
            }

            // Switch turns
            [attacker, defender] = [defender, attacker];
            await prompts({ type: 'text', name: 'continue', message: 'Press Enter for next turn...' }); // Pause
        }
        return {}; // Should be covered by HP checks
    }

    // New method to create NPCs
    public createNPC(npcId: string): NPC | undefined { // Removed game parameter as it's available via this
        if (npcId === 'Wim_Battle') {
            return new NPC({
                id: 'Wim_Battle',
                name: 'Wim (Ambusher)',
                health: 10,
                maxHealth: 10,
                goldDrop: 3,
                itemDropChance: 0.005, // 0.5%
                aiBehavior: (self, targetPlayer, gameInstance) => {
                    const attackRoll = gameInstance.rollBattleDice(6); // Wim uses 1d6 for attack
                    console.log(`${self.name} attacks with a roll of ${attackRoll}!`);
                    gameInstance.performAttack(self, targetPlayer, attackRoll);
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
                    const attackRoll = gameInstance.rollBattleDice(6); // Spindle uses 1d6 for attack
                    console.log(`${self.name} attacks fiercely with a roll of ${attackRoll}!`);
                    gameInstance.performAttack(self, targetPlayer, attackRoll);
                }
            });
        }
        console.warn(`createNPC: Unknown NPC ID requested: ${npcId}`);
        return undefined;
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
