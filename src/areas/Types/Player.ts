import Status from './Status';
import Tile from './Tile';
import Game from './Game';
import Move from './Movement';
import Inventory from './Inventory';

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
  status: Status;
  inventory: Inventory;
  move: Move;


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
    constructor(game: Game, id: number) {
        this.game = game;
        this.id = id;
        this.character_id = 0;
        this.isAlive = true;
        this.status = new Status(this.id);
        this.inventory = new Inventory(this);
        this.move = new Move(this)
      } 

    //  GAME RELATED METHODS
    
    // PICK CHARACTER

    public pickCharacter(character_id: number) {
    this.character_id = character_id;
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
    
    public getEffect() {
    return this.status.effects;
    }
    
    public effectSet(effects: string[]) {
    this.status.effects = effects;
    }

    public effectAdd(effect: string) {
    this.status.effects.push(effect);
    }

    public effectRemove(effect: string) {
    const index = this.status.effects.indexOf(effect);
    if (index > -1) {
        this.status.effects.splice(index, 1);
    }
    }
}