import Player from "./Player";
import NPC from "./Npc"; // Import NPC from backend
import Game from "./Game"; // Import Game from backend
import { ItemFactory, IBaseItem } from "./Item"; // Assuming Item and ItemFactory are available in backend

interface BattleContext {
    isBossBattle?: boolean;
    initiator?: Player | NPC; // To determine who initiated the battle
}

export default class Battle {
    private player1: Player;
    private opponent: Player | NPC;
    private gameInstance: Game; // Reference to the main game instance
    private playerActionResolver: ((action: { value: string, actionData?: any }) => void) | null = null; // Resolver for player action promise


    constructor(player1: Player, opponent: Player | NPC, gameInstance: Game) {
        this.player1 = player1;
        this.opponent = opponent;
        this.gameInstance = gameInstance;
    }

    // Method to process incoming player actions
    public processPlayerAction(playerId: number, action: string, actionData?: any): void {
        // Check if the action is for the current player whose turn it is
        // This requires tracking whose turn it is within the Battle instance
        // For now, assuming the server-side listener handles turn validation
        if (this.playerActionResolver) {
            this.playerActionResolver({ value: action, actionData });
            this.playerActionResolver = null; // Reset resolver after action is processed
        } else {
            console.warn(`Received player action (${action}) for player ${playerId}, but no action is currently awaited.`);
        }
    }

    // Method for battle dice rolls
    public rollBattleDice(sides: number = 6): number {
        return Math.floor(Math.random() * sides) + 1;
    }

    // Method to perform an attack
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

    // Method to initiate and manage a battle
    public async initiateBattle(context?: BattleContext): Promise<{ winner?: Player | NPC, loser?: Player | NPC }> {
        const opponentIsPlayer = this.opponent instanceof Player;
        let attacker: Player | NPC, defender: Player | NPC;

        console.log(`\n--- Battle Initiated: ${this.player1.nameOrCharacter()} vs ${this.opponent.nameOrCharacter()} ---`);
        console.log(`Initial HP: ${this.player1.nameOrCharacter()}: ${this.player1.getHealth()}, ${this.opponent.nameOrCharacter()}: ${this.opponent.getHealth()}`);

        // --- Apply Food/Cactus HP adjustments at the start of battle ---
        if (this.player1.status.hasBattleEffect('Food')) {
            this.player1.setHealth(this.player1.getHealth() + 2);
            console.log(`${this.player1.getCharacterName()} uses Food effect, starting with +2 HP! Current HP: ${this.player1.getHealth()}`);
        }
        if (this.player1.status.hasBattleEffect('Cactus')) {
            this.player1.setHealth(Math.max(1, this.player1.getHealth() - 2)); // Not below 1 HP
            console.log(`${this.player1.getCharacterName()} is affected by Cactus, starting with -2 HP! Current HP: ${this.player1.getHealth()}`);
        }
        // Similar checks if opponent is also a Player and can have these effects (assuming NPCs don't have battle effects for now)

        // --- Determine Turn Order ---
        const p1Boots = this.player1.status.hasBattleEffect('Cowboy_Boots');
        const oppBoots = (this.opponent instanceof Player && this.opponent.status.hasBattleEffect('Cowboy_Boots'));

        let p1GoesFirst: boolean;
        if (p1Boots && !oppBoots) {
            p1GoesFirst = true;
            console.log(`${this.player1.getCharacterName()} has Cowboy Boots and attacks first!`);
        } else if (!p1Boots && oppBoots) {
            p1GoesFirst = false;
            console.log(`${this.opponent.nameOrCharacter()} has Cowboy Boots and attacks first!`);
        } else { // Both have boots OR Neither has boots
            if (p1Boots && oppBoots) console.log("Both combatants have Cowboy Boots! Turn order is random.");
            else console.log("No Cowboy Boots active for turn priority. Turn order is random.");
            p1GoesFirst = Math.random() < 0.5;
        }

        if (p1GoesFirst) {
            attacker = this.player1; defender = this.opponent;
        } else {
            attacker = this.opponent; defender = this.player1;
        }
        if (attacker instanceof Player) console.log(`${attacker.getCharacterName()} will go first.`);
        else console.log(`${attacker.name} (NPC) will go first.`);


        while (this.player1.getHealth() > 0 && this.opponent.getHealth() > 0) {
            console.log(`\n--- ${attacker.nameOrCharacter()}'s Turn ---`);
            // Reset shield if attacker had defended in their previous turn
            if (attacker instanceof Player && attacker.status.isDefending) {
                console.log(`${attacker.getCharacterName()}'s shield from last turn fades.`);
                attacker.status.shield = 0;
                attacker.status.isDefending = false;
            }

            console.log(`${this.player1.nameOrCharacter()} HP: ${this.player1.getHealth()} (Shield: ${this.player1.status.shield || 0}), ${this.opponent.nameOrCharacter()} HP: ${this.opponent instanceof Player ? this.opponent.getHealth() : this.opponent.health} (Shield: ${this.opponent instanceof Player ? this.opponent.status.shield || 0 : 0})`);

            let actionChoice;
            if (attacker instanceof Player) {
                console.log(`${attacker.getCharacterName()}, waiting for action...`);
                // Emit event to frontend to prompt for action
                this.gameInstance.io.to(this.gameInstance.game_id).emit('requestBattleAction', {
                    playerId: attacker.id,
                    availableActions: ['attack', 'defend'], // TODO: Dynamically determine available actions (e.g., based on items)
                    // Add other relevant state for frontend UI
                });

                // Wait for player action
                actionChoice = await new Promise<{ value: string, actionData?: any }>(resolve => {
                    this.playerActionResolver = resolve;
                });

                console.log(`Player ${attacker.getCharacterName()} chose action: ${actionChoice.value}`);

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

                // Emit battle state update after player action
                this.gameInstance.io.to(this.gameInstance.game_id).emit('battleStateUpdate', {
                    player1Health: this.player1.getHealth(),
                    player1Shield: this.player1.status.shield,
                    opponentHealth: this.opponent instanceof Player ? this.opponent.getHealth() : this.opponent.health,
                    opponentShield: this.opponent instanceof Player ? this.opponent.status.shield : 0,
                    // Add other relevant state updates
                });


            } else { // NPC's turn (Wim or Spindle)
                attacker.aiBehavior(attacker, defender as Player, this.gameInstance); // NPC AI targets the player

                // Emit battle state update after NPC action
                 this.gameInstance.io.to(this.gameInstance.game_id).emit('battleStateUpdate', {
                    player1Health: this.player1.getHealth(),
                    player1Shield: this.player1.status.shield,
                    opponentHealth: this.opponent instanceof Player ? this.opponent.getHealth() : this.opponent.health,
                    opponentShield: this.opponent instanceof Player ? this.opponent.status.shield : 0,
                    // Add other relevant state updates
                });
            }

            // Check for defeat
            if (defender.getHealth() <= 0) {
                console.log(`\n${defender.nameOrCharacter()} has been defeated!`);

                // --- Consume Battle Effects ---
                this.player1.status.consumeAllBattleEffects();
                console.log(`${this.player1.getCharacterName()}'s battle effects have worn off.`);
                if (this.opponent instanceof Player) {
                    this.opponent.status.consumeAllBattleEffects();
                    console.log(`${this.opponent.getCharacterName()}'s battle effects have worn off.`);
                }

                // --- Handle Win/Loss Consequences ---
                // PvP Win Condition
                if (opponentIsPlayer && attacker instanceof Player) {
                    const victor = attacker as Player;
                    const defeated = defender as Player;
                    console.log(`${victor.getCharacterName()} wins the PvP battle!`);

                    // TODO: Implement mechanism to receive steal choice asynchronously
                    // For now, assume victor always steals gold
                    const stealChoiceValue = 'gold'; // Placeholder

                    if (stealChoiceValue === 'gold') {
                        const goldStolen = Math.min(defeated.getGold(), 3); // Use getGold
                        victor.gold(`+${goldStolen}`); // Use gold method
                        defeated.gold(`-${goldStolen}`); // Use gold method
                        console.log(`${victor.getCharacterName()} steals ${goldStolen} gold from ${defeated.getCharacterName()}.`);
                    } else if (stealChoiceValue === 'item' && defeated.inventory.items.length > 0) {
                        const itemStolen = defeated.inventory.removeRandomItem(); // Use the new method
                        if (itemStolen) {
                            victor.inventory.addItem(itemStolen); // Use the new method
                            console.log(`${victor.getCharacterName()} steals ${itemStolen.name} from ${defeated.getCharacterName()}.`);
                    }
                }

                // PvP Defeat Specifics
                defeated.setHealth(defeated.maxHealth); // Reset HP to max
                console.log(`${defeated.getCharacterName()}'s HP is restored to ${defeated.maxHealth}.`);
                // Assuming Player class in backend has a move property with a back method
                await defeated.move.back(2); // Move loser back 2 tiles
                console.log(`${defeated.getCharacterName()} is moved back 2 tiles.`);

            }
            // PvNPC (Wim) Win Condition
                else if (defender instanceof NPC && attacker instanceof Player) {
                     console.log(`${attacker.getCharacterName()} defeated ${defender.name}!`);
                     if (defender.id === 'Wim_Battle') {
                         if (defender.goldDrop) {
                             attacker.gold(`+${defender.goldDrop}`); // Use gold method
                             console.log(`You looted ${defender.goldDrop} gold.`);
                         }
                         if (defender.itemDropChance && Math.random() < defender.itemDropChance) {
                             // Get a less expensive shop item
                             const lessExpensiveItemIds = [0, 3, 6, 7, 8]; // Lasso, Poison Crossbow, Rigged Dice, V.S. Item, Tumbleweed
                             const randomItemId = lessExpensiveItemIds[Math.floor(Math.random() * lessExpensiveItemIds.length)];
                             // Assuming ItemFactory is available in backend
                             const droppedItem = ItemFactory.createItem(randomItemId, attacker);
                             if (droppedItem) {
                                 attacker.inventory.addItem(droppedItem); // Use the new method
                                 console.log(`You found a rare item: ${droppedItem.name}!`);
                             } else {
                                 console.log("You found an item, but there was an issue creating it.");
                             }
                         }
                     }
                     // Spindle win is handled by BossBattleEvent (needs to be implemented in backend)
                }
                // Player Lost to NPC (Wim/Spindle)
                else if (attacker instanceof NPC && defender instanceof Player) {
                     console.log(`${defender.getCharacterName()} was defeated by ${attacker.name}.`);
                     if (!context?.isBossBattle) { // Wim loss
                        // Assuming Player class in backend has handleBattleLoss method
                        await defender.handleBattleLoss(this.gameInstance, { moveBackTiles: 2, goldLoss: 3, itemLossCount: 1 }); // Use the new method
                     } else { // Spindle loss (BossBattleEvent handles the move back, gold/item loss)
                        console.log("You have been defeated by Spindle!"); // BossBattleEvent will manage consequences
                     }
                }
                return { winner: attacker, loser: defender }; // Battle ends
            }

            // Check for defeat again after processing action
            if (defender.getHealth() <= 0) {
                 console.log(`\n${defender.nameOrCharacter()} has been defeated!`);

                // --- Consume Battle Effects ---
                this.player1.status.consumeAllBattleEffects();
                console.log(`${this.player1.getCharacterName()}'s battle effects have worn off.`);
                if (this.opponent instanceof Player) {
                    this.opponent.status.consumeAllBattleEffects();
                    console.log(`${this.opponent.getCharacterName()}'s battle effects have worn off.`);
                }

                // --- Handle Win/Loss Consequences ---
                // PvP Win Condition
                if (opponentIsPlayer && attacker instanceof Player) {
                    const victor = attacker as Player;
                    const defeated = defender as Player;
                    console.log(`${victor.getCharacterName()} wins the PvP battle!`);

                    // TODO: Implement mechanism to receive steal choice asynchronously
                    // For now, assume victor always steals gold
                    const stealChoiceValue = 'gold'; // Placeholder

                    if (stealChoiceValue === 'gold') {
                        const goldStolen = Math.min(defeated.getGold(), 3); // Use getGold
                        victor.gold(`+${goldStolen}`); // Use gold method
                        defeated.gold(`-${goldStolen}`); // Use gold method
                        console.log(`${victor.getCharacterName()} steals ${goldStolen} gold from ${defeated.getCharacterName()}.`);
                    } else if (stealChoiceValue === 'item' && defeated.inventory.items.length > 0) {
                        const itemStolen = defeated.inventory.removeRandomItem(); // Use the new method
                        if (itemStolen) {
                            victor.inventory.addItem(itemStolen); // Use the new method
                            console.log(`${victor.getCharacterName()} steals ${itemStolen.name} from ${defeated.getCharacterName()}.`);
                    }
                }

                // PvP Defeat Specifics
                defeated.setHealth(defeated.maxHealth); // Reset HP to max
                console.log(`${defeated.getCharacterName()}'s HP is restored to ${defeated.maxHealth}.`);
                // Assuming Player class in backend has a move property with a back method
                await defeated.move.back(2); // Move loser back 2 tiles
                console.log(`${defeated.getCharacterName()} is moved back 2 tiles.`);

            }
            // PvNPC (Wim) Win Condition
                else if (defender instanceof NPC && attacker instanceof Player) {
                     console.log(`${attacker.getCharacterName()} defeated ${defender.name}!`);
                     if (defender.id === 'Wim_Battle') {
                         if (defender.goldDrop) {
                             attacker.gold(`+${defender.goldDrop}`); // Use gold method
                             console.log(`You looted ${defender.goldDrop} gold.`);
                         }
                         if (defender.itemDropChance && Math.random() < defender.itemDropChance) {
                             // Get a less expensive shop item
                             const lessExpensiveItemIds = [0, 3, 6, 7, 8]; // Lasso, Poison Crossbow, Rigged Dice, V.S. Item, Tumbleweed
                             const randomItemId = lessExpensiveItemIds[Math.floor(Math.random() * lessExpensiveItemIds.length)];
                             // Assuming ItemFactory is available in backend
                             const droppedItem = ItemFactory.createItem(randomItemId, attacker);
                             if (droppedItem) {
                                 attacker.inventory.addItem(droppedItem); // Use the new method
                                 console.log(`You found a rare item: ${droppedItem.name}!`);
                             } else {
                                 console.log("You found an item, but there was an issue creating it.");
                             }
                         }
                     }
                     // Spindle win is handled by BossBattleEvent (needs to be implemented in backend)
                }
                // Player Lost to NPC (Wim/Spindle)
                else if (attacker instanceof NPC && defender instanceof Player) {
                     console.log(`${defender.getCharacterName()} was defeated by ${attacker.name}.`);
                     if (!context?.isBossBattle) { // Wim loss
                        // Assuming Player class in backend has handleBattleLoss method
                        await defender.handleBattleLoss(this.gameInstance, { moveBackTiles: 2, goldLoss: 3, itemLossCount: 1 }); // Use the new method
                     } else { // Spindle loss (BossBattleEvent handles the move back, gold/item loss)
                        console.log("You have been defeated by Spindle!"); // BossBattleEvent will manage consequences
                     }
                }
                return { winner: attacker, loser: defender }; // Battle ends
            }


            // Switch turns
            [attacker, defender] = [defender, attacker];
            console.log("Turn switch. Waiting for next action...");
            // Emit turn change event
            this.gameInstance.io.to(this.gameInstance.game_id).emit('battleStateUpdate', {
                currentTurnPlayerId: attacker instanceof Player ? attacker.id : 'NPC', // Indicate whose turn it is
                // Include other relevant state
            });
        }
        return {}; // Should be covered by HP checks
    }
}
