import Status from './Status';
import Tile from './Tile';
import Game from './Game';
import Move from './Movement';
import Inventory from '../Player/Inventory';

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

  constructor(game: Game, id: number) {
    this.game = game;
    this.id = id;
    this.character_id = 0;
    this.isAlive = true;
    this.status = new Status(this.id);
    this.inventory = new Inventory(this);
    this.move = new Move(this);
  } 

  // GAME RELATED METHODS
  
  public pickCharacter(character_id: number) {
    this.character_id = character_id;
  }

  public killPlayer() {
    this.isAlive = false;
  }

  // STATUS RELATED METHODS

  /**
   * Sets player's gold amount
   */
  public setGold(amount: number): void {
    this.status.gold = amount;
  }

  /**
   * Gets player's current gold
   */
  public getGold(): number {
    return this.status.gold;
  }

  /**
   * Gets player's current health
   */
  public getHealth(): number {
    return this.status.health;
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

  // EFFECTS
  
  /**
   * Adds an effect to the player
   */
  public effectAdd(name: string, duration: number = 1): void {
    this.status.effectAdd(name, duration);
  }

  /**
   * Removes an effect from the player
   */
  public effectRemove(name: string): void {
    this.status.effects = this.status.effects.filter(e => e.name !== name);
  }

  /**
   * Checks if player has a specific effect
   */
  public hasEffect(name: string): boolean {
    return this.status.effects.some(e => e.name === name);
  }

  /**
   * Checks if player is currently stunned
   */
  public isStunned(): boolean {
    return this.status.isStunned();
  }
}
