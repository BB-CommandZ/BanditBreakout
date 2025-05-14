export interface IEffect {
    name: string;
    duration: number;
}

export default class Status {
    public health: number;
    public gold: number;
    public effects: IEffect[];
    public isAlive: boolean;
    private remainingMoves: number;
    private resolvedDecisionPath: number | null;
    private nextDiceRoll: number | null;
    private nextTurnPath: number | null;
    private remainingStepsAfterDecision: number | null;
    private isMidMovement: boolean;

    constructor(initialGold: number = 10) {
        this.health = 10;
        this.gold = initialGold;
        this.effects = [];
        this.isAlive = true;
        this.remainingMoves = 0;
        this.resolvedDecisionPath = null;
        this.nextDiceRoll = null;
        this.nextTurnPath = null;
        this.remainingStepsAfterDecision = null;
        this.isMidMovement = false;
    }

    public getGold(): number {
        return this.gold;
    }

    public setGold(amount: number): void {
        this.gold = amount;
    }

    public updateGold(change: string): void {
        const value = parseInt(change);
        if (!isNaN(value)) {
            this.gold += value;
            if (this.gold < 0) this.gold = 0;
        }
    }

    public getHealth(): number {
        return this.health;
    }

    public setHealth(hp: number): void {
        this.health = Math.max(0, hp);
        if (this.health === 0) this.isAlive = false;
    }

    public effectAdd(name: string, duration: number): void {
        const existingIndex = this.effects.findIndex(e => e.name === name);
        if (existingIndex !== -1) {
            this.effects.splice(existingIndex, 1);
        }
        this.effects.push({ name, duration });
    }

    public effectRemove(name: string): void {
        this.effects = this.effects.filter(e => e.name !== name);
    }

    public hasEffect(name: string): boolean {
        return this.effects.some(e => e.name === name);
    }

    public decrementEffectDurations(): void {
        this.effects = this.effects.filter(effect => {
            if (effect.duration > 0) {
                effect.duration--;
                return effect.duration > 0;
            }
            return true;
        });
    }

    public isStunned(): boolean {
        const stunEffects = ["lasso_stun", "poison_stun", "cursedCoffin_stun"];
        return this.effects.some(e => stunEffects.includes(e.name) && e.duration > 0);
    }

    public setRemainingMoves(moves: number): void {
        this.remainingMoves = moves;
    }

    public getRemainingMoves(): number {
        return this.remainingMoves;
    }

    public setResolvedDecisionPath(tileId: number): void {
        this.resolvedDecisionPath = tileId;
    }

    public getResolvedDecisionPath(): number | null {
        return this.resolvedDecisionPath;
    }

    public clearResolvedDecisionPath(): void {
        this.resolvedDecisionPath = null;
    }

    public setNextDiceRoll(roll: number): void {
        this.nextDiceRoll = roll;
    }

    public getNextDiceRoll(): number | null {
        const roll = this.nextDiceRoll;
        this.nextDiceRoll = null;
        return roll;
    }

    public setNextTurnPath(tileId: number): void {
        this.nextTurnPath = tileId;
    }

    public getNextTurnPath(): number | null {
        const path = this.nextTurnPath;
        this.nextTurnPath = null;
        return path;
    }

    public clearNextTurnPath(): void {
        this.nextTurnPath = null;
    }

    public setRemainingStepsAfterDecision(steps: number): void {
        this.remainingStepsAfterDecision = steps;
    }

    public getRemainingStepsAfterDecision(): number | null {
        const steps = this.remainingStepsAfterDecision;
        this.remainingStepsAfterDecision = null;
        return steps;
    }

    public getStepsRemaining(): number | null {
        return this.remainingStepsAfterDecision;
    }

    public clearRemainingStepsAfterDecision(): void {
        this.remainingStepsAfterDecision = null;
    }

    public setMidMovement(state: boolean): void {
        this.isMidMovement = state;
    }

    public getIsMidMovement(): boolean {
        return this.isMidMovement;
    }

    public getEffects(): IEffect[] {
        return [...this.effects];
    }

    public getSaveData() {
        return {
            health: this.health,
            gold: this.gold,
            effects: [...this.effects],
            isAlive: this.isAlive,
            remainingMoves: this.remainingMoves,
            resolvedDecisionPath: this.resolvedDecisionPath
        };
    }

    public loadFromSave(saveData: any) {
        this.health = saveData.health;
        this.gold = saveData.gold;
        this.effects = [...saveData.effects];
        this.isAlive = saveData.isAlive;
        this.remainingMoves = saveData.remainingMoves || 0;
        this.resolvedDecisionPath = saveData.resolvedDecisionPath || null;
    }
}
