import Player from "../Types/Player";
import Game from "../Types/Game";
import { 
    IBaseItem, IBattleItem, IMapItem, 
    ItemFactory, RiggedDiceItem,
    ShovelItem
} from "../Types/Item";

export default class Inventory {
    private player: Player;
    private game: Game;
    items: IBaseItem[];
    private readonly MAX_ITEMS = 3;

    constructor(player: Player) {
        this.player = player;
        this.game = this.player.game;
        this.items = [];
    }

    public canAddItem(): boolean {
        return this.items.length < this.MAX_ITEMS;
    }

    public async obtain(itemId: number): Promise<boolean> {
        if (!this.canAddItem()) {
            console.log(`Player ${this.player.id}'s inventory is full (Max ${this.MAX_ITEMS}). Cannot obtain item ID ${itemId}.`);
            return false;
        }
        const item = ItemFactory.createItem(itemId, this.player);
        if (item) {
            this.items.push(item);
            console.log(`Player ${this.player.id} obtained item: ${item.name}.`);
            return true;
        }
        return false;
    }

    public async obtainRandom(): Promise<boolean> {
        if (!this.canAddItem()) {
            console.log(`Player ${this.player.id}'s inventory is full (Max ${this.MAX_ITEMS}). Cannot obtain random item.`);
            return false;
        }
        const randomId = Math.floor(Math.random() * 11);
        const item = ItemFactory.createItem(randomId, this.player);
        if (item) {
            this.items.push(item);
            console.log(`Player ${this.player.id} obtained random item: ${item.name}.`);
            return true;
        }
        return false;
    }

    public getItems(): {id: number, name: string}[] {
        return this.items.map(item => ({
            id: item.id,
            name: item.name
        }));
    }

    public getSaveData() {
        return this.getItems();
    }

    public async loadFromSave(saveData: any): Promise<void> {
        this.items = [];
        if (Array.isArray(saveData)) {
            for (const itemData of saveData) {
                if (itemData.id !== undefined) {
                    await this.obtain(itemData.id);
                }
            }
        }
    }

    public removeItem(item: IBaseItem): void {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    public hasItem(itemId: number): boolean {
        return this.items.some(item => item.id === itemId);
    }

    private findItem(itemId: number): IBaseItem | null {
        return this.items.find(item => item.id === itemId) || null;
    }

    public async useItem(itemId: number, targetPlayer?: Player): Promise<void> {
        const item = this.findItem(itemId);
        if (!item) {
            console.log(`Item with ID ${itemId} not found in inventory.`);
            return;
        }

        if (!item.isUsable) {
            console.log(`Item ${item.name} is not actively usable.`);
            return;
        }

        if (item.isBattleItem) {
            const battleItem = item as IBattleItem;
            if (!targetPlayer && item.id !== 2) { // Vest (ID 2) is self-use
                console.log(`Battle item ${item.name} requires a target player.`);
                return;
            }
            if (item.id === 2) { // Vest
                await battleItem.useAgainst(this.player);
            } else if (targetPlayer) {
                await battleItem.useAgainst(targetPlayer);
            }
        } else {
            const mapItem = item as IMapItem;
            await mapItem.use();
        }
        this.removeItem(item);
    }
}
