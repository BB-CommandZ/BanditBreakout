import Player from "./Player";
export const ITEM_LIST: { id: number; name: string }[] = [
    { id: 0, name: "Lasso" },
    { id: 1, name: "Shovel" },
    { id: 2, name: "Vest" },
    { id: 3, name: "Poison Crossbow" },
    { id: 4, name: "Mirage Teleporter" },
    { id: 5, name: "Cursed Coffin" },
    { id: 6, name: "Rigged Dice" },
    { id: 7, name: "V.S." },
    { id: 8, name: "Tumbleweed" },
    { id: 9, name: "Magic Carpet" },
    { id: 10, name: "Wind Staff" },
];

/**
 * Base interface for all items
 */
export interface IBaseItem {
    id: number;
    name: string;
    effect: string;
    isBattleItem: boolean;
    isUsable: boolean;
    player: Player;
}

/**
 * Interface for standard map items
 */
export interface IMapItem extends IBaseItem {
    use(): void;
}

/**
 * Interface for items that target other players
 */
export interface IBattleItem extends IBaseItem {
    useAgainst(opponent: Player): void;
}

export class LassoItem implements IBattleItem {
    id: number = 0;
    name: string = "Lasso";
    effect: string = "Pick a player and catch them with the lasso, making them unable to move for 1 round.";
    isBattleItem: boolean = true;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        opponent.effectAdd("lassoStun")
    }

}


export class ShovelItem implements IBattleItem {
    id: number = 1;
    name: string = "Shovel";
    effect: string = "Pick a player and dig an underground tunnel to them.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        let opponentPos = this.player.game.map.findPlayer(opponent.id);
        this.player.move.to(opponentPos);
    }
}

export class VestItem implements IMapItem {
    id: number = 2;
    name: string = "Vest";
    effect: string = "This item will grant immunity to you the next time you are targeted by another item from a player. It will activate automatically and will be removed once used.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        this.player.effectAdd("vest");
    }
}

export class PoisonCrossbowItem implements IBattleItem {
    id: number = 3;
    name: string = "Poison Crossbow";
    effect: string = "Pick a player and shoot them with a poison dart. This stuns them for 1 round.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        opponent.effectAdd("poisonStun");
    }
}

export class MirageTeleporterItem implements IBattleItem {
    id: number = 4;
    name: string = "Mirage Teleporter";
    effect: string = "Pick a player and instantly swap places with them. You cannot roll their dice after using this item.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        this.player.move.swap(opponent);
        console.log('There shoudl be an end trun fucntion here');
    }
}

export class CursedCoffinItem implements IMapItem {
    id: number = 5;
    name: string = "Cursed Coffin";
    effect: string = "You dig up a cursed coffin. The next player who passes this tile will be forced into the cursed tomb. This leaves them stuck there for 2 rounds.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        let map = this.player.game.map
        let playerTileId = map.findPlayer(this.player.id)
        let cursedCoffin = map.createEventOfType(9, playerTileId)
    }
}

export class RiggedDiceItem implements IMapItem {
    id: number = 6;
    name: string = "Rigged Dice";
    effect: string = "Upon use, you can assign your desired value to your dice roll. You cannot roll their dice after using this item.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        // TODO
    }
}

export class VSItem implements IBattleItem {
    id: number = 7;
    name: string = "V.S.";
    effect: string = "Pick a player to battle with! Winner gets to move 1 space forward, while the loser moves 2 spaces back.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        // TODO
        // this.player.game.battle(this.player, opponent);
    }
}

export class TumbleweedItem implements IMapItem {
    id: number = 8;
    name: string = "Tumbleweed";
    effect: string = "Ride a tumbleweed and move forward 3 spaces.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        this.player.move.front(3);
    }
}

export class MagicCarpetItem implements IMapItem {
    id: number = 9;
    name: string = "Magic Carpet";
    effect: string = "Carries you over to any region on the map. The user cannot roll their dice after using this item.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        // TODO
        // I think this is too op, need to be adjacent region
    }
}

export class WindStaffItem implements IBattleItem {
    id: number = 10;
    name: string = "Wind Staff";
    effect: string = "Pick a player to target and blow them back 3 spaces.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        opponent.move.back(3);
    }
}

// // Factory
// /**
//   * Creates a new item based on the given type
//   * 
//   * @param type - The type of item to create
//   * - 0: LassoItem
//   * - 1: ShovelItem
//   * - 2: VestItem
//   * - 3: PoisonCrossbowItem
//   * - 4: MirageTeleporterItem
//   * - 5: CursedCoffinItem
//   * - 6: RiggedDiceItem
//   * - 7: VSItem
//   * - 8: TumbleweedItem
//   * - 9: MagicCarpetItem
//   * - 10: WindStaffItem
//   * @returns An instance of the appropriate item class
//   */
export class ItemFactory {
    public static createItem(type: number, player: Player): IBaseItem {
        switch (type) {
            case 0: return new LassoItem(player);
            // case 1: return new ShovelItem();
            // case 2: return new VestItem();
            // case 3: return new PoisonCrossbowItem();
            // case 4: return new MirageTeleporterItem();
            // case 5: return new CursedCoffinItem();
            // case 6: return new RiggedDiceItem();
            // case 7: return new VSItem();
            case 8: return new TumbleweedItem(player);
            // case 9: return new MagicCarpetItem();
            // case 10: return new WindStaffItem();
            default: return new TumbleweedItem(player);
        }
    }
}