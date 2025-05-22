import Tile from "./Tile";
import Game from "./Game";


// IEvent interface, defining the structure of an event


/**
 * Represents a tile event that can occur during gameplay
 * 
 * Events are triggered by landing on specific tiles 
 */
export interface IEvent {
    name: string;
    type: number;
    description: string;
    effect: string;
    tile: Tile;

    onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void>; // Updated signature
}

// NOTHING EVENT (TYPE 0)
export class NothingEvent implements IEvent {
    name = "Nothing";
    type = 0;
    description = "Default";
    effect = "Starting Tile/Debugging";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on start`);
    }
}

// SAFE EVENT (TYPE 1)
export class SafeEvent implements IEvent {
    name = "Safe";
    type = 1;
    description = "This is a safe area";
    effect = "You feel protected here. Gain 3 gold.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        const player = game.players.find(player => player.id === playerId);
        if (player) {
            player.gold('+3');
            console.log(`Player ${playerId} gained 3 gold from stepping on a Safe tile.`);
        }
    }
}
// BATTLE EVENT (TYPE 2)
export class BattleEvent implements IEvent {
    name = "Battle";
    type = 2;
    description = "Ambushed by a random thug!";
    effect = "Start a battle!";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);
    }
}

// BATTLE EFFECT EVENT (TYPE 3)
export class BattleEffectEvent implements IEvent {
    name = "Battle Effect";
    type = 3;
    description = "You get a fancy drink and chug it.";
    effect = "Gain a battle buff for your next battle.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);

        const player = game.players.find(player => player.id === playerId);
         if (player) {
             player.effectAdd("battle_buff");
             console.log(`Player ${playerId} gained a battle buff!`);
         }
    }
}

// ITEM EVENT (TYPE 4)
export class ItemEvent implements IEvent {
    name = "Item";
    type = 4;
    description = "You find a chest!";
    effect = "Receive a random item.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        const player = game.players.find(player => player.id === playerId);
         if (player) {
             player.inventory.obtainRandom()
             let latestAddition = player.inventory.items.length - 1
             let newItem = player.inventory.items[latestAddition]
             console.log(`Player ${playerId} found an item: ${newItem}`);
         }
    }
}

// EVENT (TYPE 5) - Story or special events
export class StoryEvent implements IEvent {
    name = "Event";
    type = 5;
    description = "A story or special event occurs.";
    effect = "Something interesting happens!";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);
    }
}

// SLOTS EVENT (TYPE 6)
export class SlotsEvent implements IEvent {
    name = "Slots";
    type = 6;
    description = "Try your luck at the slots!";
    effect = "Gain or lose a random amount of gold.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        const player = game.players.find(player => player.id === playerId);
        if (player) {
            // Give between -10 and 50 gold, but don't let gold go below 0
            let amount = Math.floor(Math.random() * 61) - 10; // -10 to 50
            let newGold = player.getGold() + amount;
            if (newGold < 0) {
                amount = -player.getGold(); // Remove all gold if would go below 0
            }
            player.gold(`${amount >= 0 ? '+' : ''}${amount}`);
            console.log(`Player ${playerId} played slots and ${amount >= 0 ? 'won' : 'lost'} ${Math.abs(amount)} gold.`);
        }
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);
    }
}

// MINING EVENT (TYPE 7)
export class MiningEvent implements IEvent {
    name = "Mining";
    type = 7;
    description = "Enter the mines and dig for gold.";
    effect = "Gain a random amount of gold.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        const player = game.players.find(player => player.id === playerId);
        if (player) {
            // Give between 10 and 30 gold
            const amount = Math.floor(Math.random() * 21) + 10; // 10 to 30
            player.gold(`+${amount}`);
            console.log(`Player ${playerId} mined and gained ${amount} gold.`);
        }
    }
}

// DECISION EVENT (TYPE 8)
export class DecisionEvent implements IEvent {
    name = "Decision";
    type = 8;
    description = "You come across a fork in the road.";
    effect = "Make a choice that affects your path.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);
    }
}

// CURSED COFFIN EVENT (TYPE 9) (COMES FROM ITEMS)
export class CursedCoffinEvent implements IEvent {
    name = "Cursed Coffin";
    type = 9;
    description = "You dig up a cursed coffin.";
    effect = "You are forced into the cursed tomb. You are stuck here for 2 rounds!";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`);
        let player = game.players[playerId]
        player.effectAdd("cursedCoffin")
        //remove the event
    }
}

// SHOP EVENT (TYPE 5)
export class ShopEvent implements IEvent {
    name = "Shop";
    type = 5;
    description = "Wim's Wares! A chance to buy useful items.";
    effect = "Purchase items with your gold.";
    tile: Tile;

    public allShopItems = [ // Renamed to avoid conflict with selected items
        { id: 2, name: "Vest", price: 15 },
        { id: 3, name: "Poison Crossbow", price: 10 },
        { id: 0, name: "Lasso", price: 10 },
        { id: 7, name: "V.S. Item", price: 10 },
        { id: 6, name: "Rigged Dice", price: 10 },
        { id: 10, name: "Wind Staff", price: 25 },
        { id: 5, name: "Cursed Coffin", price: 15 },
        { id: 4, name: "Mirage Teleporter", price: 30 },
        { id: 1, name: "Shovel", price: 25 },
        { id: 9, name: "Magic Carpet", price: 50 },
        { id: 8, name: "Tumbleweed", price: 15 },
    ];

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game, totalStepsRemainingInSequence: number): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`ShopEvent: Player ${playerId} not found.`);
            return;
        }

        if (totalStepsRemainingInSequence !== 0) { // Only trigger shop on final landing
            console.log(`Player ${playerId} passed through Shop tile ${this.tile.index}.`);
            return;
        }

        console.log(`\nWelcome to Wim's Wares, Player ${player.id}!`);
        console.log(`Your current gold: ${player.getGold()}`);

        // Select 3 random items
        const shuffledItems = this.allShopItems.sort(() => 0.5 - Math.random());
        const itemsForSale = shuffledItems.slice(0, 3);

        // TODO: Emit Socket.IO event to frontend with itemsForSale and player.getGold()
        console.log(`Shop items for Player ${player.id}:`, itemsForSale);
        console.log("TODO: Emit Socket.IO event 'shopOpen' to frontend with itemsForSale and player gold.");

        // The rest of the shop logic (player interaction, buying) will be handled by Socket.IO listeners
        // on the backend, triggered by frontend events.
    }

    // TODO: Add Socket.IO listener methods for buy actions
}


// Factory
    /**
      * Creates a new event based on the given type
      *
      * @param type - The type of event to create
      * - 0: NothingEvent
      * - 1: SafeEvent
      * - 2: BattleEvent
      * - 3: BattleEffectEvent
      * - 4: ItemEvent
      * - 5: ShopEvent
      * - 6: SlotsEvent
      * - 7: MiningEvent
      * - 8: DecisionEvent
      * @returns An instance of the appropriate event class
      */
export class EventFactory {
    public static createEvent(type: number, tile: Tile): IEvent {
        switch (type) {
            case 0: return new NothingEvent(tile);
            case 1: return new SafeEvent(tile);
            case 2: return new BattleEvent(tile);
            case 3: return new BattleEffectEvent(tile);
            case 4: return new ItemEvent(tile);
            case 5: return new ShopEvent(tile); // Changed from StoryEvent to ShopEvent
            case 6: return new SlotsEvent(tile);
            case 7: return new MiningEvent(tile);
            case 8: return new DecisionEvent(tile);
            case 9: return new CursedCoffinEvent(tile);
            default: return new NothingEvent(tile);
        }
    }
}
