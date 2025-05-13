import Player from "./Player";
import { IEvent } from "./Event";

export interface IBaseItem {
    id: number;
    name: string;
    effect: string;
    isBattleItem: boolean;
    isUsable: boolean;
    player: Player;
}

export interface IMapItem extends IBaseItem {
    use(): Promise<void>;
}

export interface IBattleItem extends IBaseItem {
    useAgainst(opponent: Player): Promise<void>;
}

export class LassoItem implements IBattleItem {
    id = 0; name = "Lasso"; effect = "Pick a player and catch them, making them unable to move for 1 round.";
    isBattleItem = true; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async useAgainst(opponent: Player): Promise<void> {
        console.log(`${this.player.id} uses Lasso on ${opponent.id}.`);
        opponent.status.effectAdd("lasso_stun", 1);
    }
}

export class ShovelItem implements IMapItem {
    id = 1; name = "Shovel"; effect = "Pick a player and dig an underground tunnel to them.";
    isBattleItem = false; isUsable = true; player: Player;
    targetPlayerId?: number;

    constructor(player: Player) { this.player = player; }

    public async use(): Promise<void> {
        console.log("Shovel used directly - target player should be selected via inventory");
    }

    public async useOnTarget(targetPlayer: Player): Promise<void> {
        const targetTile = this.player.game.map.findPlayer(targetPlayer.id);
        if (targetTile !== -1) {
            console.log(`${this.player.id} uses Shovel to move to Player ${targetPlayer.id}'s tile (${targetTile}).`);
            await this.player.move.to(targetTile);
        }
    }
}

export class VestItem implements IBattleItem {
    id = 2; name = "Vest"; effect = "Grants immunity to the next item used against you.";
    isBattleItem = true; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async useAgainst(opponent: Player): Promise<void> {
        if (opponent.id === this.player.id) {
            console.log(`${this.player.id} uses Vest on themself.`);
            this.player.status.effectAdd("vest_immunity", -1);
        }
    }
}

export class PoisonCrossbowItem implements IBattleItem {
    id = 3; name = "Poison Crossbow"; effect = "Shoot a player with a poison dart, making them unable to move for 1 round.";
    isBattleItem = true; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async useAgainst(opponent: Player): Promise<void> {
        console.log(`${this.player.id} uses Poison Crossbow on ${opponent.id}.`);
        opponent.status.effectAdd("poison_stun", 1);
    }
}

export class MirageTeleporterItem implements IMapItem {
    id = 4; name = "Mirage Teleporter"; effect = "Swap places with another player on the map.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(): Promise<void> {
        console.log("Mirage Teleporter used directly - target player should be selected via inventory");
    }
    public async useWithTarget(targetPlayer: Player): Promise<void> {
        console.log(`${this.player.id} uses Mirage Teleporter to swap with ${targetPlayer.id}.`);
        await this.player.move.swap(targetPlayer);
        this.player.status.setRemainingMoves(0);
    }
}

export class CursedCoffinItem implements IMapItem {
    id = 5; name = "Cursed Coffin"; effect = "Place a cursed coffin on your current tile. The next player to land here gets stuck for 2 rounds.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(): Promise<void> {
        const currentTileId = this.player.game.map.findPlayer(this.player.id);
        if (currentTileId !== -1) {
            const tile = this.player.game.map.tiles[currentTileId];
            tile.setEvent(9, tile);
            console.log(`${this.player.id} placed a Cursed Coffin trap on Tile ${currentTileId}.`);
        }
    }
}

export class RiggedDiceItem implements IMapItem {
    id = 6; name = "Rigged Dice"; effect = "Assign your desired value to your next dice roll (1-6). Cannot roll after use.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(diceValue?: number): Promise<void> {
        if (typeof diceValue === 'number' && diceValue >= 1 && diceValue <= 6) {
            console.log(`${this.player.id} uses Rigged Dice, will move by ${diceValue} spaces.`);
            this.player.status.effectAdd("rigged_dice_active", 0);
            this.player.status.setNextDiceRoll(diceValue);
            this.player.status.setRemainingMoves(0);
        }
    }
}

export class VSItem implements IBattleItem {
    id = 7; name = "V.S. Item"; effect = "Challenge another player to a battle. Winner moves 1 space forward, loser moves 2 spaces back.";
    isBattleItem = true; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async useAgainst(opponent: Player): Promise<void> {
        console.log(`${this.player.id} uses V.S. Item to challenge ${opponent.id} to a battle!`);
    }
}

export class TumbleweedItem implements IMapItem {
    id = 8; name = "Tumbleweed"; effect = "Summon a giant tumbleweed that rolls forward 3 spaces, pushing any player it hits 1 space back.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(): Promise<void> {
        console.log(`${this.player.id} uses Tumbleweed!`);
        // Implementation would go here
    }
}

/*
export class MagicCarpetItem implements IMapItem {
    id = 9; name = "Magic Carpet"; effect = "Carries you over to any region/tile on the map (max 24 tiles away recommended). Cannot roll dice after use.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(targetTileId?: number): Promise<void> {
        // Use default parameter with validation
        const validatedTileId = this.validateTileId(targetTileId);
        if (validatedTileId === null) return;

        console.log(`${this.player.id} uses Magic Carpet to travel to Tile ${validatedTileId}.`);
        await this.player.move.to(validatedTileId);
        this.player.status.setRemainingMoves(0);
        this.player.status.setNextDiceRoll(0); // Reset dice roll
    }

    private validateTileId(tileId?: number): number | null {
        if (tileId === undefined || tileId === null) {
            console.log("Magic Carpet requires a target tile ID");
            return null;
        }
        if (!Number.isInteger(tileId) || tileId < 0 || tileId > 102) {
            console.log(`Invalid tile ID ${tileId} - must be an integer between 0 and 102`);
            return null;
        }
        return tileId;
    }
}
*/

/*
export class WindStaffItem implements IMapItem {
    id = 10; name = "Wind Staff"; effect = "Push all other players 2 spaces back from their current position.";
    isBattleItem = false; isUsable = true; player: Player;
    constructor(player: Player) { this.player = player; }
    public async use(): Promise<void> {
        console.log(`${this.player.id} uses Wind Staff!`);
        for (const otherPlayer of this.player.game.players) {
            if (otherPlayer.id !== this.player.id && otherPlayer.isAlive) {
                console.log(`Pushing Player ${otherPlayer.id} back 2 spaces.`);
                await otherPlayer.move.back(2);
            }
        }
    }
}
*/

export class ItemFactory {
    public static createItem(itemId: number, player: Player): IBaseItem | null {
        switch (itemId) {
            case 0: return new LassoItem(player);
            case 1: return new ShovelItem(player);
            case 2: return new VestItem(player);
            case 3: return new PoisonCrossbowItem(player);
            case 4: return new MirageTeleporterItem(player);
            case 5: return new CursedCoffinItem(player);
            case 6: return new RiggedDiceItem(player);
            case 7: return new VSItem(player);
            case 8: return new TumbleweedItem(player);
            // case 9: return new MagicCarpetItem(player);
            // case 10: return new WindStaffItem(player);
            default:
                console.warn(`ItemFactory: Unknown item ID ${itemId} requested.`);
                return null;
        }
    }
}
