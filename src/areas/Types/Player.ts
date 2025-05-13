import Game from "./Game";
import Status from "./Status";
import Inventory from "../Player/Inventory";
import Move from "./Movement";
import { ICharacter, Characters } from "./Character";
import { IBaseItem } from "./Item";

export default class Player {
    public id: number;
    public game: Game;
    public status: Status;
    public inventory: Inventory;
    public move: Move;
    public character: ICharacter | null;
    public character_id: number;

    constructor(game: Game, id: number, initialGold: number = 10, characterId?: number) {
        this.id = id;
        this.game = game;
        this.status = new Status(initialGold);
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

    public async handleBattleLoss(): Promise<void> {
        console.log(`Player ${this.id} lost a battle.`);
        this.gold("-3");
        console.log(`Player ${this.id} lost 3 gold. Current gold: ${this.getGold()}`);

        if (this.inventory.items.length > 0) {
            const itemToLose = this.inventory.items[0];
            console.log(`Player ${this.id} lost item: ${itemToLose.name}.`);
            this.inventory.removeItem(itemToLose);
        } else {
            console.log(`Player ${this.id} has no items to lose.`);
        }
        await this.move.back(2);
    }

    public getSaveData() {
        return {
            id: this.id,
            characterId: this.character_id,
            status: this.status.getSaveData(),
            inventory: this.inventory.getItems(),
        };
    }

    public loadFromSave(saveData: any) {
        this.id = saveData.id;
        if (saveData.characterId) {
            this.selectCharacter(saveData.characterId);
        }
        this.status.loadFromSave(saveData.status);
        this.inventory.loadFromSave(saveData.inventory);
    }
}
