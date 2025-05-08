import Player from "./Player";
// Forward declaration or import for Game if needed by items, though usually player.game is sufficient
// import Game from "./Game"; 

/**
 * Base interface for all items
 */
export interface IBaseItem {
    id: number;
    name: string;
    effect: string; // Description of the item's effect
    isBattleItem: boolean; // True if primarily used IN a battle, or targets players directly for aggressive effect
    isUsable: boolean; // Can the item be actively used by a player?
    player: Player; // The player who owns this item instance
}

/**
 * Interface for standard map items (used on self or map, not directly targeting others for harm/hindrance)
 */
export interface IMapItem extends IBaseItem {
    use(): void; // Use the item, typically on the player themselves or the map
}

/**
 * Interface for items that target other players or are used in aggressive contexts
 */
export interface IBattleItem extends IBaseItem {
    // Target another player. Could be on map or during a battle.
    useAgainst(opponent: Player): void; 
}

export class LassoItem implements IBattleItem {
    id: number = 0;
    name: string = "Lasso";
    effect: string = "Pick a player and catch them with the lasso, making them unable to move for 1 round.";
    isBattleItem: boolean = true; // Targets another player to hinder them
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        console.log(`Player ${this.player.id} uses ${this.name} against Player ${opponent.id}.`);
        opponent.effectAdd("lasso_stun"); // Specific stun effect
    }
}

export class ShovelItem implements IBattleItem { // Changed to IBattleItem due to useAgainst
    id: number = 1;
    name: string = "Shovel";
    effect: string = "Pick a player and dig an underground tunnel to their tile.";
    isBattleItem: boolean = true; // Targets another player's location
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        const opponentPos = this.player.game.map.findPlayer(opponent.id);
        if (opponentPos !== -1) {
            console.log(`Player ${this.player.id} uses ${this.name} to move to Player ${opponent.id}'s tile (${opponentPos}).`);
            this.player.move.to(opponentPos);
        } else {
            console.log(`Player ${this.player.id} tried to use ${this.name}, but Player ${opponent.id} was not found on the map.`);
        }
    }
}

export class VestItem implements IMapItem {
    id: number = 2;
    name: string = "Vest";
    effect: string = "Grants immunity to the next targeted item. Activates automatically and is removed once used.";
    isBattleItem: boolean = false; // Defensive, self-use
    isUsable: boolean = true; // Player actively uses it to gain the effect
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        console.log(`Player ${this.player.id} uses ${this.name}.`);
        this.player.effectAdd("vest_immunity"); // Specific immunity effect
    }
}

export class PoisonCrossbowItem implements IBattleItem {
    id: number = 3;
    name: string = "Poison Crossbow";
    effect: string = "Pick a player and shoot them with a poison dart. This stuns them for 1 round.";
    isBattleItem: boolean = true; // Targets another player to hinder them
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        console.log(`Player ${this.player.id} uses ${this.name} against Player ${opponent.id}.`);
        opponent.effectAdd("poison_stun"); // Specific stun effect
    }
}

export class MirageTeleporterItem implements IBattleItem {
    id: number = 4;
    name: string = "Mirage Teleporter";
    effect: string = "Pick a player and instantly swap places with them. You cannot roll dice after using this item.";
    isBattleItem: boolean = true; // Targets another player
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        console.log(`Player ${this.player.id} uses ${this.name} to swap places with Player ${opponent.id}.`);
        this.player.move.swap(opponent);
        // Add logic to end player's turn or prevent dice roll if game rules require it
        // e.g., this.player.game.endTurnForItemEffect(this.player.id);
        console.log(`Player ${this.player.id}'s turn might end after using Mirage Teleporter.`);
    }
}

export class CursedCoffinItem implements IMapItem {
    id: number = 5;
    name: string = "Cursed Coffin";
    effect: string = "Place a trap on your current tile. The next player to land here gets stuck for 2 rounds.";
    isBattleItem: boolean = false; // It's a trap-setting item, not direct combat/targeting
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        const playerTileId = this.player.game.map.findPlayer(this.player.id);
        if (playerTileId !== -1) {
            // createEventOfType in Map.ts should handle setting the event on the tile
            this.player.game.map.createEventOfType(9, playerTileId); // 9 is CursedCoffinEvent type
            console.log(`Player ${this.player.id} used ${this.name} to set a trap on tile ${playerTileId}.`);
        } else {
            console.error(`Player ${this.player.id} could not use ${this.name}: Player not found on map.`);
        }
    }
}

export class RiggedDiceItem implements IMapItem {
    id: number = 6;
    name: string = "Rigged Dice";
    effect: string = "Upon use, you can choose your dice roll value for this turn. Cannot roll normally after use.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        // This item's effect will likely be handled in the game's turn sequence.
        // Player uses item -> sets a flag like player.status.hasRiggedDice = true
        // Then, when it's dice roll time, game checks this flag.
        console.log(`Player ${this.player.id} uses ${this.name}. (Implementation: Player should be prompted for dice value)`);
        this.player.effectAdd("rigged_dice_active"); 
        // Game logic will need to check for 'rigged_dice_active' before normal dice roll
        // and prompt for input, then remove the effect.
    }
}

export class VSItem implements IBattleItem {
    id: number = 7;
    name: string = "V.S.";
    effect: string = "Pick a player to battle with! Winner moves 1 space forward, loser moves 2 spaces back.";
    isBattleItem: boolean = true; // Initiates a player vs. player battle
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        console.log(`Player ${this.player.id} uses ${this.name} to challenge Player ${opponent.id} to a battle!`);
        // Future: this.player.game.initiateBattle(this.player, opponent, { type: 'vsItem', rewards: { winner: +1, loser: -2 } });
        console.log("(VS Battle logic to be implemented)");
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
        console.log(`Player ${this.player.id} uses ${this.name} to move forward 3 spaces.`);
        this.player.move.front(3);
    }
}

export class MagicCarpetItem implements IMapItem {
    id: number = 9;
    name: string = "Magic Carpet";
    effect: string = "Carries you to any region on the map. Cannot roll dice after using this item.";
    isBattleItem: boolean = false;
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public use(): void {
        // This will require more complex map/region logic and player input.
        console.log(`Player ${this.player.id} uses ${this.name}. (Implementation: Player should be prompted for target region/tile)`);
        this.player.effectAdd("magic_carpet_move_pending");
        // Game logic will need to handle this, possibly ending turn after move.
        // e.g., this.player.game.endTurnForItemEffect(this.player.id);
    }
}

export class WindStaffItem implements IBattleItem {
    id: number = 10;
    name: string = "Wind Staff";
    effect: string = "Pick a player to target and blow them back 3 spaces.";
    isBattleItem: boolean = true; // Targets another player to hinder them
    isUsable: boolean = true;
    player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    public useAgainst(opponent: Player): void {
        console.log(`Player ${this.player.id} uses ${this.name} against Player ${opponent.id}.`);
        opponent.move.back(3);
    }
}

export class ItemFactory {
    public static createItem(type: number, player: Player): IBaseItem {
        switch (type) {
            case 0: return new LassoItem(player);
            case 1: return new ShovelItem(player); // Uncommented and constructor matched
            case 2: return new VestItem(player);   // Uncommented and constructor matched
            case 3: return new PoisonCrossbowItem(player); // Uncommented and constructor matched
            case 4: return new MirageTeleporterItem(player); // Uncommented and constructor matched
            case 5: return new CursedCoffinItem(player); // Uncommented and constructor matched
            case 6: return new RiggedDiceItem(player);   // Uncommented and constructor matched
            case 7: return new VSItem(player);           // Uncommented and constructor matched
            case 8: return new TumbleweedItem(player);
            case 9: return new MagicCarpetItem(player);  // Uncommented and constructor matched
            case 10: return new WindStaffItem(player); // Uncommented and constructor matched
            default:
                // Changed default to throw an error for unrecognised item types
                console.error(`ItemFactory: Unknown item type ${type} requested.`);
                throw new Error(`ItemFactory: Attempted to create unknown item type ${type}.`);
        }
    }
}
