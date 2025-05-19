import Status from './Status';
import Tile from './Tile';
import Game from './Game';
import Move from './Movement';
import Inventory from './Inventory';
import { IEffect } from './Status'; // Import IEffect

/**
 * Represents a player on the map
 * 
 * Contains:
 * 
 * - Game id
 * - Health, gold, effects, items
 * - Is the player alive
 * - Current position
 */
export default class Player {
  game: Game;
  id: number;
  character_id: number;
  isAlive: boolean;
  maxHealth: number; // Added maxHealth property
  status: Status;
  inventory: Inventory;
  move: Move;
  // tracks forks that still need a decision from the client
  pendingMove?: { stepsRemaining: number };


    /**
   * Creates a new Player instance
   * 
   * @param game_id - The game session identifier. Set to "" by default
   * @param id - The unique player identifier. Set to 0 by default
   * @param character_id - The chosen character class ID. Set to 0 by default
   * @param isAlive - Whether the player is alive (defaults to true)
   * @param status - The player's status object with gold, health and effects
   * @param inventory - Initial items in inventory (defaults to empty array)
   */
    constructor(game: Game, id: number, initialHealth: number = 10) { // Added initialHealth parameter
        this.game = game;
        this.id = id;
        this.character_id = 0;
        this.isAlive = true;
        this.maxHealth = initialHealth; // Initialize maxHealth
        this.status = new Status(this.id); // Assuming Status constructor can handle initial gold if needed
        this.status.health = initialHealth; // Set initial health
        this.inventory = new Inventory(this);
        this.move = new Move(this)
      } 

    //  GAME RELATED METHODS
    
    // PICK CHARACTER

    public pickCharacter(character_id: number) {
        this.character_id = character_id;
    }

    // Method to get character name (placeholder - needs actual character data)
    public getCharacterName(): string {
        // TODO: Implement logic to get character name based on character_id
        return `Character_${this.character_id}`; // Placeholder implementation
    }

    // Method to get player or character name
    public nameOrCharacter(): string {
        return this.getCharacterName();
    }

    // KILL PLAYER

    public killPlayer() {
    this.isAlive = false;
    }

    // STATUS RELATED METHODS



    // GOLD AND HEALTH MANAGEMENT

  /**
   * Manage player's gold using string commands
   * @param action - Command string: "+5" (add 5), "-5" (remove 5), "=5" (set to 5)
   * @returns Current gold amount after operation
   */
  public gold(action: string): number {
    return this._manageResource(action, 'gold');
  }

  /**
   * Manage player's health using string commands
   * @param action - Command string: "+5" (heal 5), "-5" (damage 5), "=5" (set to 5)
   * @returns Current health amount after operation
   */
  public health(action: string): number {
    const result = this._manageResource(action, 'health');

    if (this.status.health <= 0) {
      this.killPlayer();
    }

    return result;
  }

  // Method to set health directly (wraps the health method)
  public setHealth(hp: number): void {
      this.health(`=${hp}`);
  }
  
  private _manageResource(action: string, resourceType: 'gold' | 'health'): number {
    const firstChar = action.charAt(0);
    const amount = parseInt(action.substring(1));
    
    if (firstChar === '+') {
      this.status[resourceType] += amount;

    } else if (firstChar === '-') {
      this.status[resourceType] = Math.max(0, this.status[resourceType] - amount);

    } else if (firstChar === '=') {
      this.status[resourceType] = amount;

    }
    
    return this.status[resourceType];
  }

    public getGold() {
    return this.status.gold;
    }

    public getHealth() {
    return this.status.health;
    }


    // EFFECTS
    
    public getEffect(): IEffect[] { // Updated return type
        return this.status.effects;
    }
    
    public effectSet(effects: IEffect[]) { // Updated parameter type
        this.status.effects = effects;
    }

    public effectAdd(effect: IEffect) { // Updated parameter type
        this.status.effects.push(effect);
    }

    public effectRemove(effectName: string) { // Updated parameter type to string for easier removal by name
        this.status.effects = this.status.effects.filter(e => e.name !== effectName);
    }

    // Method to handle battle loss consequences
    public async handleBattleLoss(gameInstance: Game, options: { moveBackTiles?: number, goldLoss?: number, itemLossCount?: number }): Promise<void> {
        console.log(`${this.getCharacterName()} is handling battle loss.`);

        // Gold Loss
        if (options.goldLoss !== undefined && options.goldLoss > 0) {
            const goldLost = Math.min(this.getGold(), options.goldLoss);
            this.gold(`-${goldLost}`); // Use the existing gold method
            console.log(`${this.getCharacterName()} lost ${goldLost} gold.`);
        }

        // Item Loss (simplified - removes random items)
        if (options.itemLossCount !== undefined && options.itemLossCount > 0) {
            for (let i = 0; i < options.itemLossCount; i++) {
                const lostItem = this.inventory.removeRandomItem(); // Assuming removeRandomItem exists
                if (lostItem) {
                    console.log(`${this.getCharacterName()} lost item: ${lostItem.name}.`);
                    // TODO: Logic to give item to winner if applicable (PvP)
                } else {
                    console.log(`${this.getCharacterName()} has no items to lose.`);
                    break; // Stop trying to remove items if none are left
                }
            }
        }

        // Move Back
        if (options.moveBackTiles !== undefined && options.moveBackTiles > 0) {
             // Assuming Move class in backend has a back method
            await this.move.back(options.moveBackTiles);
            console.log(`${this.getCharacterName()} moved back ${options.moveBackTiles} tiles.`);
        }

        // Reset HP after loss (as per game design doc for PvP)
        // Note: Game design doc says reset HP after PvP loss, not PvE loss.
        // The game engine code resets HP after PvP loss. I'll add it here but might need adjustment based on context.
        this.setHealth(this.maxHealth);
        console.log(`${this.getCharacterName()}'s HP is restored to ${this.maxHealth}.`);

        // TODO: Emit event to client about battle loss consequences
    }
}
