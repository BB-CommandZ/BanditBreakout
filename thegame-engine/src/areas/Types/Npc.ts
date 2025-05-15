import Player from "./Player";
import Game from "./Game";
import { IBaseItem } from "./Item";

export interface INPC {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    goldDrop?: number;
    itemDropChance?: number;
    // itemToDrop?: string; // Optional: for specific item drops
    aiBehavior: (self: NPC, targetPlayer: Player, gameInstance: Game) => void;
}

export default class NPC implements INPC {
    public id: string;
    public name: string;
    public health: number;
    public maxHealth: number;
    public goldDrop?: number;
    public itemDropChance?: number;
    // public itemToDrop?: string;
    public aiBehavior: (self: NPC, targetPlayer: Player, gameInstance: Game) => void;

    constructor(config: INPC) {
        this.id = config.id;
        this.name = config.name;
        this.health = config.health;
        this.maxHealth = config.maxHealth;
        this.goldDrop = config.goldDrop;
        this.itemDropChance = config.itemDropChance;
        // this.itemToDrop = config.itemToDrop;
        this.aiBehavior = config.aiBehavior;
    }

    public getHealth(): number {
        return this.health;
    }

    public setHealth(hp: number): void {
        this.health = Math.max(0, hp);
    }

    public nameOrCharacter(): string {
        return this.name;
    }
}
