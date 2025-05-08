import Player from "../Types/Player";
import Game from "../Types/Game";
import { IBaseItem, IBattleItem, IMapItem, ItemFactory } from "../Types/Item";

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
        const item = this.makeItem(itemId);
        this.addItem(item);
        console.log(`Player ${this.player.id} obtained item: ${item.name}`);
    }

    private makeItem(itemId: number): IBaseItem {
        return ItemFactory.createItem(itemId, this.player);
    }

    private addItem(item: IBaseItem): void {
        this.items.push(item);
    }

    public removeItem(item: IBaseItem): void {
        const index = this.items.findIndex(itemIndex => itemIndex === item);
        if (index !== -1) {
            this.items.splice(index, 1);
        }
    }

    public obtainRandom() {
        let randomId = Math.floor(Math.random() * 11);
        const item = this.makeItem(randomId);
        this.addItem(item);
        console.log(`Player ${this.player.id} obtained item: ${item.name}`);
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
