/**
 * Represents a player's current status
 * 
 * Status tracks:
 * 
 * - Health
 * - Gold
 * - If there is an effect active
 * - Effect
 */
export default class Status {
    player_id: number;
    gold: number;
    health: number;
    hasEffect: boolean;
    effects: {name: string, duration: number}[];
    
    /**
     * Creates a new Status instance
     * 
     * @param player_id - The player this status belongs to
     * @param gold - The amount of gold the player has (defaults to 0)
     * @param health - The player's current health (defaults to 10)
     * @param hasEffect - Whether the player has an active effect (defaults to false)
     * @param effects - Array of effect objects (defaults to empty array)
     */
    constructor(player_id: number) {
        this.player_id = player_id;
        this.gold = 0;
        this.health = 10;
        this.hasEffect = false;
        this.effects = [];
    }

    /**
     * Gets current effects in serializable format
     */
    public getEffects(): {name: string, duration: number}[] {
        return [...this.effects]; // Return copy to prevent modification
    }

    /**
     * Adds a new effect to the player's status
     * @param effectName - Name of the effect to add
     * @param duration - Duration in turns (-1 or Infinity for permanent, 0 for immediate, >0 for timed)
     */
    effectAdd(effectName: string, duration: number = 1): void {
        this.effects.push({name: effectName, duration});
        this.hasEffect = true;
    }

    /**
     * Decrements effect durations and removes expired effects
     */
    decrementEffectDurations(): void {
        this.effects = this.effects.filter(effect => {
            if (effect.duration > 0) {
                effect.duration--;
                return effect.duration > 0;
            }
            return effect.duration === -1 || effect.duration === Infinity;
        });
        this.hasEffect = this.effects.length > 0;
    }

    /**
     * Checks if player is currently stunned
     * @returns true if player has any active stun effects
     */
    isStunned(): boolean {
        const stunEffects = ['lasso_stun', 'poison_stun', 'cursedCoffin_stun'];
        return this.effects.some(effect => 
            stunEffects.includes(effect.name) && effect.duration > 0
        );
    }
}
