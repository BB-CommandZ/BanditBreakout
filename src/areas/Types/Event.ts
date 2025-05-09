import Tile from "./Tile";
import Game from "./Game";
import prompts from 'prompts';
// Removed 'TumbleweedItem' import as it's not directly used here.
// Items are handled through player.inventory

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

    onStep(playerId: number, game: Game): Promise<void>;
}

// NOTHING EVENT (TYPE 0)
export class NothingEvent implements IEvent {
    name = "Nothing";
    type = 0;
    description = "Default";
    effect = "Nothing happens on this tile."; // Changed for clarity
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game): Promise<void> {
        // More generic message
        console.log(`Player ${playerId} landed on tile ${this.tile.index}. Nothing special happens.`);
        return Promise.resolve();
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

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`SafeEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        player.setGold(player.getGold() + 3);
        console.log(`Player ${playerId} landed on a Safe tile ${this.tile.index} and gained 3 gold. Current gold: ${player.getGold()}`);
        return Promise.resolve();
    }    
}

// BATTLE EVENT (TYPE 2)
export class BattleEvent implements IEvent {
    name = "Battle";
    type = 2;
    description = "Ambushed by a random thug!";
    effect = "Start a battle!";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`BattleEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        console.log(`Player ${playerId} stepped on tile ${this.tile.index} and is ambushed! (Battle logic to be implemented)`);
        // Future: game.initiateBattle(player, 'randomThug');
        return Promise.resolve();
    }
}    

// BATTLE EFFECT EVENT (TYPE 3)
export class BattleEffectEvent implements IEvent {
    name = "Battle Effect";
    type = 3;
    description = "You get a fancy drink and chug it.";
    effect = "Gain a battle buff for your next battle.";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`BattleEffectEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        player.effectAdd("battle_buff"); // Ensure "battle_buff" is recognized by your effect system
        console.log(`Player ${playerId} stepped on tile ${this.tile.index}, gained a battle buff!`);
        return Promise.resolve();
    }    
}

// ITEM EVENT (TYPE 4)
export class ItemEvent implements IEvent {
    name = "Item";
    type = 4;
    description = "You find a chest!";
    effect = "Receive a random item.";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId); // Corrected variable name
        if (!player) {
            console.error(`ItemEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        // Use obtainRandom() as discussed. The log for item name is in obtainRandom().
        player.inventory.obtainRandom(); 
        console.log(`Player ${playerId} searched tile ${this.tile.index} and found an item!`);
        return Promise.resolve();
    }
}

// EVENT (TYPE 5) - Story or special events
export class StoryEvent implements IEvent {
    name = "Event"; // Consider a more descriptive name like "Story Encounter" if appropriate
    type = 5;
    description = "A story or special event occurs.";
    effect = "Something interesting happens!";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`StoryEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        console.log(`Player ${playerId} stepped on tile ${this.tile.index}. A story event unfolds! (Story logic to be implemented)`);
        // Future: game.triggerStoryEvent(this.tile.storyId); // Potentially pass a story ID from the tile
        return Promise.resolve();
    }
}    

// SLOTS EVENT (TYPE 6)
export class SlotsEvent implements IEvent {
    name = "Slots";
    type = 6;
    description = "Try your luck at the slots!";
    effect = "Gain or lose a random amount of gold.";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`SlotsEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        const amount = Math.floor(Math.random() * 61) - 10; // Results in a range from -10 to +50
        const currentGold = player.getGold();
        player.setGold(currentGold + amount);

        console.log(`Player ${playerId} stepped on tile ${this.tile.index}, played slots and ${amount >= 0 ? 'won' : 'lost'} ${Math.abs(amount)} gold. Current gold: ${player.getGold()}`);
        return Promise.resolve();
    }
}

// MINING EVENT (TYPE 7)
export class MiningEvent implements IEvent {
    name = "Mining";
    type = 7;
    description = "Enter the mines and dig for gold.";
    effect = "Gain a random amount of gold.";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`MiningEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        const goldGained = Math.floor(Math.random() * 21) + 10; // Generates a number between 10 and 30
        player.setGold(player.getGold() + goldGained);
        console.log(`Player ${playerId} stepped on tile ${this.tile.index}, mined and gained ${goldGained} gold. Current gold: ${player.getGold()}`);
        return Promise.resolve();
    }
}

// DECISION EVENT (TYPE 8)
export class DecisionEvent implements IEvent {
    name = "Decision";
    type = 8;
    description = "You come across a fork in the road.";
    effect = "Make a choice that affects your path.";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`DecisionEvent: Player ${playerId} not found.`);
            return;
        }

        console.log(`Player ${playerId} reached a decision point on tile ${this.tile.index}!`);
        const possiblePaths = this.tile.getFront(); // Assuming getFront() returns tile indices as number[]

        if (!possiblePaths || possiblePaths.length === 0) {
            console.log("No forward paths available from this decision point. Staying put.");
            return;
        }

        if (possiblePaths.length === 1) {
            console.log(`Only one path forward to tile ${possiblePaths[0]}. Moving automatically.`);
            await player.move.to(possiblePaths[0]); // player.move.to should also be async if it calls onStep
            return;
        }

        const choices = possiblePaths.map(pathIndex => ({
            title: `Go to Tile ${pathIndex}`, // You might want more descriptive paths later
            value: pathIndex
        }));

        const response = await prompts({
            type: 'select',
            name: 'chosenPath',
            message: 'Choose your path:',
            choices: choices
        });

        if (typeof response.chosenPath !== 'undefined') {
            console.log(`Player ${playerId} chose to move to Tile ${response.chosenPath}.`);
            await player.move.to(response.chosenPath); 
        } else {
            console.log(`Player ${playerId} made no choice. Staying on tile ${this.tile.index}.`);
            // Or default to first path, or re-prompt, based on desired game rules
        }
    }
}

// CURSED COFFIN EVENT (TYPE 9) (COMES FROM ITEMS)
export class CursedCoffinEvent implements IEvent {
    name = "Cursed Coffin Trap"; // Renamed for clarity as it's the TRAP event
    type = 9;
    description = "A previously placed Cursed Coffin trap springs!";
    effect = "You are forced into the cursed tomb. You are stuck here for 2 rounds!";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game): Promise<void> {
        const player = game.players.find(p => p.id === playerId); // Corrected player retrieval
        if (!player) {
            console.error(`CursedCoffinEvent: Player ${playerId} not found.`);
            return Promise.resolve();
        }
        
        console.log(`Player ${playerId} stepped on tile ${this.tile.index} and triggered a Cursed Coffin trap!`);
        player.effectAdd("cursedCoffin_stun"); // Ensure "cursedCoffin_stun" makes player miss 2 turns
        console.log(`Player ${playerId} is stunned by the Cursed Coffin for 2 rounds.`);

        // Revert the tile's event to NothingEvent (type 0) after the trap is sprung
        // This assumes Tile.setEvent takes (eventType: number, tileContext: Tile)
        this.tile.setEvent(0, this.tile); 
        console.log(`Cursed Coffin trap removed from tile ${this.tile.index}. It now has a NothingEvent.`);
        return Promise.resolve();
    }
}

// Factory
/**
  * Creates a new event based on the given type
  * 
  * @param type - The type of event to create
  * @param tile - The tile on which the event occurs
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
            case 9: return new CursedCoffinEvent(tile); // This event is set by the CursedCoffinItem
            default: 
                console.warn(`EventFactory: Unknown event type ${type} requested for tile ${tile.index}. Defaulting to NothingEvent.`);
                return new NothingEvent(tile);
        }
    }
}
