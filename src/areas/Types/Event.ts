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

    onStep(playerId: number, game: Game): void;
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
        const player = game.players.find(player => player.id === playerId);
         if (player) {
             player.inventory.obtainRandom()
             let latestAddition = player.inventory.items.length
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
        // TODO FIX LATER
        // const player = game.players.find(player => player.id === playerId);
        // if (player) {
        //     const amount = Math.floor(Math.random() * 61) - 10;
        //     if (amount >= 0) {
        //         player.gold(`+${amount}`)
        //     } else {
        //         for (let i = 0; player.getGold() > 0; i++) {
        //             player.gold(`-${i}`)
        //         }
        //     }
        //     console.log(`Player ${playerId} played slots and ${amount >= 0 ? 'won' : 'lost'} ${Math.abs(amount)} gold.`);
        // }
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

    public onStep(playerId: number, game: Game): void {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`); 
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

    public onStep(playerId: number, game: Game): void {
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

    public onStep(playerId: number, game: Game): void {
        console.log(`Player ${playerId} stepped on ${this.tile.index}`); 
        let player = game.players[playerId]
        player.effectAdd("cursedCoffin")
        //remove the event
    }
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
      * - 5: StoryEvent
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
            case 5: return new StoryEvent(tile);
            case 6: return new SlotsEvent(tile);
            case 7: return new MiningEvent(tile);
            case 8: return new DecisionEvent(tile);
            case 9: return new CursedCoffinEvent(tile);
            default: return new NothingEvent(tile);
        }
    }
}
