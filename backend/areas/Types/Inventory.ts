import Player from "./Player";
import Game from "./Game";
import { IBaseItem, IBattleItem, IMapItem, ItemFactory } from "./Item";

export default class Inventory {
    private player: Player;
    private game: Game;
    items: IBaseItem[]
    
    constructor(player: Player) {
        this.player = player;
        this.game = this.player.game;
        this.items = [];
    }

    /**
  * @param itemId - item id
  * - 0: LassoItem
  * - 1: ShovelItem
  * - 2: VestItem
  * - 3: PoisonCrossbowItem
  * - 4: MirageTeleporterItem
  * - 5: CursedCoffinItem
  * - 6: RiggedDiceItem
  * - 7: VSItem
  * - 8: TumbleweedItem
  * - 9: MagicCarpetItem
  * - 10: WindStaffItem
  */
    public obtain(itemId: number) {
        const item = ItemFactory.createItem(itemId, this.player); // Directly call factory
        if (item) { // Check if item creation was successful
            this.addItem(item);
            console.log(`Player ${this.player.id} obtained item: ${item.name}`);
        } else {
            console.warn(`Failed to obtain item with ID ${itemId} for player ${this.player.id}. Item not found or created.`);
        }
    }

    // Removed the makeItem method as it's no longer needed

    public addItem(item: IBaseItem): void { // Changed visibility to public
        this.items.push(item);
    }

    public canAddItem(): boolean {
        // Assuming a maximum inventory capacity of 3 based on Event.ts
        const MAX_ITEMS = 3; 
        return this.items.length < MAX_ITEMS;
    }

    public removeItem(item: IBaseItem): void {
        const index = this.items.findIndex(itemIndex => itemIndex === item);
        if (index !== -1) {
        this.items.splice(index, 1);
        }
    }

    public removeRandomItem(): IBaseItem | undefined { // Added removeRandomItem method
        if (this.items.length === 0) {
            return undefined; // No items to remove
        }
        const randomIndex = Math.floor(Math.random() * this.items.length);
        const removedItem = this.items.splice(randomIndex, 1)[0];
        return removedItem;
    }

    public obtainRandom() {
        let randomId = Math.floor(Math.random() * 11);
        const item = ItemFactory.createItem(randomId, this.player); // Directly call factory
        if (item) { // Check if item creation was successful
            this.addItem(item);
            console.log(`Player ${this.player.id} obtained random item: ${item.name}`);
        } else {
            console.warn(`Failed to obtain random item with ID ${randomId} for player ${this.player.id}. Item not found or created.`);
        }
    }

    /**
  * @param itemId - item id
  * - 0: LassoItem
  * - 1: ShovelItem
  * - 2: VestItem
  * - 3: PoisonCrossbowItem
  * - 4: MirageTeleporterItem
  * - 5: CursedCoffinItem
  * - 6: RiggedDiceItem
  * - 7: VSItem
  * - 8: TumbleweedItem
  * - 9: MagicCarpetItem
  * - 10: WindStaffItem
  */
    public hasItem(itemId: number): boolean {
        if (this.items.find(item => item.id === itemId)) {
            return true;
        }
        return false;
    }

    private findItem(itemId: number): IBaseItem | null {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            return item;
        } else {
            console.log(`Item with ID ${itemId} not found in inventory.`);
            return null;
        }
    }


/**
  * Uses an item from the inventory
  * 
  * @param itemId - item id to use (If they have it)
  * @param targetPlayer - optional target player for battle items
  * - 0: LassoItem
  * - 1: ShovelItem
  * - 2: VestItem
  * - 3: PoisonCrossbowItem
  * - 4: MirageTeleporterItem
  * - 5: CursedCoffinItem
  * - 6: RiggedDiceItem
  * - 7: VSItem
  * - 8: TumbleweedItem
  * - 9: MagicCarpetItem
  * - 10: WindStaffItem
  */
public useItem(itemId: number, targetPlayer?: Player): void {
    const item = this.findItem(itemId);
    
    if (!item) {
        console.log(`Item with ID ${itemId} not found in inventory.`);
        return;
    }
    
    if (item.isBattleItem) {
        const battleItem = item as IBattleItem;
        
        if (!targetPlayer) {
            console.log(`Battle item ${item.name} requires a target player.`);
            return;
        }
        
        battleItem.useAgainst(targetPlayer);
        console.log(`Player ${this.player.id} used ${item.name} against Player ${targetPlayer.id}`);
    } else {
        
        const mapItem = item as IMapItem;
        mapItem.use();
        console.log(`Player ${this.player.id} used item: ${item.name}`);
    }
    
    this.removeItem(item);
}

}
