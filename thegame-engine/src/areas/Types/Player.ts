import Game from "./Game";
import Status from "./Status";
import Inventory from "../Player/Inventory";
import Move from "./Movement";
import { ICharacter, Characters } from "./Character";
import { IBaseItem } from "./Item";
import NPC from "./Npc"; // Import NPC for type hinting in handleBattleLoss

export default class Player {
    public id: number;
    public game: Game;
    public status: Status;
    public inventory: Inventory;
    public move: Move;
    public character: ICharacter | null;
    public character_id: number;
    public maxHealth: number; // Add maxHealth property

    constructor(game: Game, id: number, initialGold: number = 10, initialHealth: number = 10, characterId?: number) { // Add initialHealth parameter
        this.id = id;
        this.game = game;
        this.maxHealth = initialHealth; // Initialize maxHealth
        this.status = new Status(initialGold); // Status constructor already sets initial health to 10, will need to update Status constructor or set health here
        this.status.setHealth(initialHealth); // Set initial health in Status
        this.inventory = new Inventory(this);
        this.move = new Move(this);
        this.character = null;
        this.character_id = 0;

        if (characterId) {
            this.selectCharacter(characterId);
        }
    }

    public selectCharacter(charId: number): boolean {
        const selectedChar = Characters.find(c => c.id === charId);
        if (selectedChar) {
            this.character = selectedChar;
            this.character_id = charId;
            console.log(`Player ${this.id} selected character: ${this.character.name}`);
            return true;
        }
        console.warn(`Player ${this.id} failed to select character ID: ${charId}`);
        return false;
    }

    public getCharacterName(): string {
        return this.character ? this.character.name : "Unselected";
    }

    public getGold(): number { 
        return this.status.getGold(); 
    }

    public setGold(amount: number): void {
        this.status.setGold(amount);
    }

    public gold(change: string): void { 
        this.status.updateGold(change); 
    }

    public getHealth(): number { 
        return this.status.getHealth();
    }

    public getMaxHealth(): number { // Add getMaxHealth method
        return this.maxHealth;
    }

    public setHealth(hp: number): void { // Add setHealth method for consistency with NPC
        this.status.setHealth(hp);
    }

    public isAlive(): boolean {
        return this.status.isAlive;
    }

    public async isTargetedByItem(itemUsedByAttacker: IBaseItem): Promise<boolean> {
        if (this.status.hasEffect("vest_immunity")) {
            console.log(`Player ${this.id}'s Vest activates! They are immune to ${itemUsedByAttacker.name}.`);
            this.status.effectRemove("vest_immunity");
            return true;
        }
        return false;
    }

    // New method to handle battle loss with options
    public async handleBattleLoss(game: Game, options: { moveBackTiles: number, goldLoss: number, itemLossCount: number }): Promise<void> {
        console.log(`Player ${this.id} (${this.getCharacterName()}) lost a battle.`);

        if (options.goldLoss > 0) {
            const goldLost = Math.min(this.getGold(), options.goldLoss);
            this.setGold(this.getGold() - goldLost);
            console.log(`Player ${this.id} lost ${goldLost} gold. Current gold: ${this.getGold()}`);
        }

        if (options.itemLossCount > 0) {
            for (let i = 0; i < options.itemLossCount; i++) {
                if (this.inventory.items.length > 0) {
                    this.inventory.removeRandomItem(); // Use the new method
                } else {
                    console.log(`Player ${this.id} has no items to lose.`);
                    break; // No more items to lose
                }
            }
        }

        if (options.moveBackTiles > 0) {
            await this.move.back(options.moveBackTiles); // Use the existing move.back
            console.log(`Player ${this.id} moved back ${options.moveBackTiles} tiles.`);
        }
    }

    public nameOrCharacter(): string { // Add nameOrCharacter method
        return this.getCharacterName();
    }

    public getSaveData() {
        return {
            id: this.id,
            characterId: this.character_id,
            status: this.status.getSaveData(),
            inventory: this.inventory.getItems(),
            maxHealth: this.maxHealth // Include maxHealth in save data
        };
    }

    public loadFromSave(saveData: any) {
        this.id = saveData.id;
        if (saveData.characterId) {
            this.selectCharacter(saveData.characterId);
        }
        this.status.loadFromSave(saveData.status);
        this.inventory.loadFromSave(saveData.inventory);
        this.maxHealth = saveData.maxHealth || 10; // Load maxHealth, default to 10
    }
}
