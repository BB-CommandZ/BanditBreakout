import Tile from "./Tile";
import Game from "./Game";
import prompts from 'prompts'; // Make sure prompts is installed and imported

export interface IEvent {
    name: string;
    type: number;
    description: string;
    effect: string;
    tile: Tile;
    onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void>;
}

// NOTHING EVENT (TYPE 0)
export class NothingEvent implements IEvent {
    name = "Nothing";
    type = 0;
    description = "An empty tile with no special effects.";
    effect = "Nothing happens.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        console.log(`Player ${playerId} landed on tile ${this.tile.index}. Nothing special happens.`);
    }
}

// SAFE EVENT (TYPE 1)
export class SafeEvent implements IEvent {
    name = "Safe";
    type = 1;
    description = "A safe haven where players gain gold.";
    effect = "Gain 3 gold.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`SafeEvent: Player ${playerId} not found.`);
            return;
        }
        // Only give reward if this is the final landing tile in this movement call
        if (isFinalStepInCall) {
            player.setGold(player.getGold() + 3);
            console.log(`Player ${playerId} landed on a Safe tile ${this.tile.index} and gained 3 gold. Current gold: ${player.getGold()}`);
        } else {
            console.log(`Player ${playerId} passed through Safe tile ${this.tile.index} (no reward during movement)`);
        }
    }
}

// BATTLE EVENT (TYPE 2)
export class BattleEvent implements IEvent {
    name = "Battle";
    type = 2;
    description = "A dangerous encounter with Wim!";
    effect = "Engage in combat with Wim.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`BattleEvent: Player ${playerId} not found.`);
            return;
        }
        console.log(`Player ${playerId} stepped on tile ${this.tile.index} and is ambushed by Wim! (Battle logic to be implemented)`);
        // Future: await game.initiateBattle(player, game.createNPC('Wim'));
    }
}

// BATTLE EFFECT EVENT (TYPE 3)
export class BattleEffectEvent implements IEvent {
    name = "Battle Buff";
    type = 3;
    description = "A tile that grants a temporary battle advantage.";
    effect = "Grants a battle buff for the next combat.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`BattleEffectEvent: Player ${playerId} not found.`);
            return;
        }
        player.status.effectAdd("battle_buff", 0); // Duration 0 means consumed after next battle
        console.log(`Player ${playerId} stepped on tile ${this.tile.index}, gained a battle buff!`);
    }
}

// ITEM EVENT (TYPE 4)
export class ItemEvent implements IEvent {
    name = "Item";
    type = 4;
    description = "A tile containing a random item.";
    effect = "Obtain a random item if inventory has space.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`ItemEvent: Player ${playerId} not found.`);
            return;
        }
        if (isFinalStepInCall && player.inventory.canAddItem()) { // Only get item on final landing
            player.inventory.obtainRandom();
            console.log(`Player ${playerId} searched tile ${this.tile.index} and found an item!`);
        } else if (isFinalStepInCall) {
             console.log(`Player ${playerId} searched tile ${this.tile.index} but their inventory is full (Max 3 items).`);
        } else {
             console.log(`Player ${playerId} passed through Item tile ${this.tile.index} (no item during movement)`);
        }
    }
}

// SHOP EVENT (TYPE 5) - Replaces StoryEvent
export class ShopEvent implements IEvent {
    name = "Shop";
    type = 5;
    description = "Wim's Wares! A chance to buy useful items.";
    effect = "Purchase items with your gold.";
    tile: Tile;

    private shopItems = [
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

    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`ShopEvent: Player ${playerId} not found.`);
            return;
        }

        if (!isFinalStepInCall) {
            console.log(`Player ${playerId} passed through Shop tile ${this.tile.index}.`);
            return;
        }

        console.log(`\nWelcome to Wim's Wares, Player ${player.id}!`);
        console.log(`Your current gold: ${player.getGold()}`);

        let shopping = true;
        while (shopping) {
            if (!player.inventory.canAddItem()) {
                console.log("Your inventory is full (Max 3 items). You cannot buy more items.");
                break;
            }

            const choices: (prompts.Choice & { type?: string })[] = [
                ...this.shopItems.map(item => ({
                    title: `${item.name} - ${item.price} gold ${player.getGold() < item.price ? '(Not enough gold)' : ''}`,
                    value: item.id,
                    disabled: player.getGold() < item.price
                })),
                {
                    type: 'separator',
                    title: '───────────────',
                    value: '',
                    disabled: true
                },
                {
                    title: "────── Exit Shop ──────",
                    value: -1,
                    disabled: false,
                    description: "Leave without buying anything"
                }
            ];

            let itemIdToBuy: number | undefined;
            try {
                const response = await prompts({
                    type: 'select',
                    name: 'value',
                    message: 'What would you like to buy?',
                    choices: choices
                });

                if (response?.value === -1) {
                    shopping = false;
                    console.log("Thanks for visiting Wim's Wares!");
                    return; // Exit immediately to allow next player's turn
                }
                itemIdToBuy = response?.value;
            } catch (err) {
                shopping = false;
                console.log("Shop closed due to cancellation.");
                return; // Exit immediately to allow next player's turn
            }

            if (typeof itemIdToBuy === 'undefined') {
                shopping = false;
                console.log("No item selected.");
                return;
            }

            const selectedShopItem = this.shopItems.find(item => item.id === itemIdToBuy);
            if (selectedShopItem) {
                if (player.getGold() >= selectedShopItem.price) {
                    if (player.inventory.canAddItem()) {
                        player.setGold(player.getGold() - selectedShopItem.price); // Deduct gold
                        player.inventory.obtain(selectedShopItem.id); // Add item
                        console.log(`You bought a ${selectedShopItem.name} for ${selectedShopItem.price} gold.`);
                        console.log(`Remaining gold: ${player.getGold()}`);
                    } else {
                         // This check is now at the top of the loop, but good to keep defensively
                        console.log("Your inventory is full!");
                    }
                } else {
                    console.log("You don't have enough gold for that item.");
                }
            }
        }
    }
}

// SLOTS EVENT (TYPE 6)
export class SlotsEvent implements IEvent {
    name = "Slots";
    type = 6;
    description = "A gambling tile where you can win or lose gold.";
    effect = "Win or lose 0-50 gold randomly.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) { return; }
        if (isFinalStepInCall) { // Only play slots on final landing
            const amount = Math.floor(Math.random() * 61) - 10;
            player.setGold(player.getGold() + amount);
            console.log(`Player ${playerId} stepped on tile ${this.tile.index}, played slots and ${amount >= 0 ? 'won' : 'lost'} ${Math.abs(amount)} gold. Current gold: ${player.getGold()}`);
        } else {
            console.log(`Player ${playerId} passed through Slots tile ${this.tile.index}.`);
        }
    }
}

// MINING EVENT (TYPE 7)
export class MiningEvent implements IEvent {
    name = "Mining";
    type = 7;
    description = "A mining tile where you can strike gold.";
    effect = "Gain 10-30 gold randomly.";
    tile: Tile;

    constructor(tile: Tile) {
        this.tile = tile;
    }
    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) { return; }
        if (isFinalStepInCall) { // Only mine on final landing
            const goldGained = Math.floor(Math.random() * 21) + 10;
            player.setGold(player.getGold() + goldGained);
            console.log(`Player ${playerId} stepped on tile ${this.tile.index}, mined and gained ${goldGained} gold. Current gold: ${player.getGold()}`);
        } else {
            console.log(`Player ${playerId} passed through Mining tile ${this.tile.index}.`);
        }
    }
}

// DECISION EVENT (TYPE 8) - Continued
export class DecisionEvent implements IEvent {
    name = "Decision";
    type = 8;
    description = "A decision point!";
    effect = "Your choice shapes your path.";
    tile: Tile;

    // Store dialogues mapped to tile indices for organization
    private decisionDialogues: Record<number, { npc: string, dialogues: string[], choices: { text: string, tileId: number }[] }> = {
        5: { // Tile 5 - Angy
            npc: "Angy",
            dialogues: [
                "You're wondering down the long, winding dusty path. You hear a faint padding from behind, turning around to come face to face with a tiger.",
                "Angy: \"Hello fellow traveler! It's been a long time since I've seen a traveler...especially with HIM always lurking...always watching. Anyways! I've got a question, one I've been reallyyy wondering about.\"",
                "The tiger stares inquisitive into your eyes, tail swishing idley as it observes you.",
                "Angy: \"Tell me, which one do you believe?\"",
                "It raises a paw and gestures to the two paths behind it.",
                "Angy: \"You only live once! Live life to the fullest! No regrets!\" the tiger says with a flick of its tail. \"Living vicariously leads to excitement, risk, and a story worth telling. Or...\"",
                "It pauses, a sharp grin crossing its face.",
                "Angy: \"would you rather take the slow lane? There's wisdom in being careful, in choosing the long road, in savoring the journey.\"",
                "The tiger's gaze locks onto yours, unreadable yet expectant. \"So, traveler... which way will you go?\""
            ],
            choices: [
                { text: "You only live once! Let's live with excitement!", tileId: 6 },
                { text: "Take it slow, take it all in. You have time.", tileId: 44 }
            ]
        },
        13: { // Tile 13 - Frogger
            npc: "Frogger",
            dialogues: [
                "As you make your way down the sandy path, the sound of bouncing and hopping catches you ear. Suddenly, a small green blur is in front of you! A frog with a smile stretched across it's face stares up at you with bright, curious eyes. The energy radiating from it almost seems impossible for such a tiny creature.",
                "Frogger: \"Howdy there! Hey, wait up!\" the frog calls out, adjusting its bandana. \"Anyways, the name's Frogger, but all my friends call me Frog.\" It puffs out its chest proudly. \"And guess what? You're my friend now!\"",
                "Frogger: Frogger leans in eagerly, buzzing with excitement. \"You know what, now that we're best buds, would you mind lending me some of your brainpower?\"",
                "It gestures dramatically toward two paths ahead.",
                "Frogger: \"Take the way that's...well, it's for cowards who suck and don't wanna be my friend. People who vibe with HIM\" It sticks out its tongue. \"Bleh!\"",
                "Frogger: \"Or take the other way? This way's for cool folks who love doing cool things!\" It does an excited little hop.",
                "Frogger: The little frog looks up at you, eyes shining with anticipation. \"So, whaddaya say, buddy? Which way you hoppin'?\""
            ],
            choices: [
                { text: "I am a loser :( I don't want to go the other way", tileId: 14 },
                { text: "I'm literally your bestie so I'm going that way!", tileId: 62 }
            ]
        },
        28: { // Tile 28 - Sofie
            npc: "Sofie",
            dialogues: [
                "As you walk into a lush, green land, you hear a sudden screech.",
                "Sofie: \"EW! A PEASANT! GET IT AWAY! HE MIGHT COME\"",
                "You barely have time to process what's happening before a tiny, prairie dog scurries up onto a rock, staring down at you with absolute disgust. It shudders dramatically, as if your mere presence is an offense to its very existence.",
                "Sofie: \"What is a peasant doing here! Do you own any land? Do you have a single gemstone to your name?!\"",
                "The prairie dog glares at you, nose twitching in disapproval. People are starting to stare and gossip. Oh no."
            ],
            choices: [
                { text: "No, you're not a peasant. You're secretly rich...", tileId: 99 },
                { text: "You are NOT dealing with this today. You run!", tileId: 29 }
            ]
        },
         54: { // Tile 54 - Tay
            npc: "Tay",
            dialogues: [
                "You're walking along a quiet, dusty road when you hear the soft click-clack of paws approaching.",
                "Tay: \"You want some sand...?\" the borzoi murmurs, tilting its head ever so slightly. \"It's the good stuff...HE likes it too...\"",
                "From seemingly nowhere, it lifts a single paw and reveals a tiny pouch filled with a fine, shimmering sand. The way it catches the light makes it impossible to tell if it's mystical, forbidden... or just really, really weird.",
                "The dog doesn't blink, doesn't break eye contact. Just waits",
                "..."
            ],
            choices: [
                { text: "Yes I love powders", tileId: 55 },
                { text: "No thanks buddy", tileId: 67 }
            ]
        },
        57: { // Tile 57 - Danny
            npc: "Danny",
            dialogues: [
                 "As you trek through a rocky canyon, a deep, laid-back voice calls down from above.",
                "\"Yooooo.\"",
                "You look up.",
                "Danny: \"A giraffe is peering down at you from the edge of a cliff. You notice how short and unnatural its neck is, almost nonexistent. Weird. It squints at you, as if trying to decide if you're even real. Then, with a slow blink, it continues.\"",
                "Danny: \"So, like... I'm pretty sure I'm being enslaved by these guys, by HIM\" it says, motioning vaguely toward a nearby cave entrance, where you notice a group of shadowy figures toiling away with pickaxes. \"But lowkey... I do like having a sugar mommy.\"",
                "Danny: \"The cave is my sugar mommy,\" it declares. \"I'm a gold digger. But man... maybe I should rethink my life choices.\"",
                "Danny: It looks down at you expectantly. \"So before I head back to work, lemme ask you... what do you think's more useful? Gold or coal?\"",
                "Danny: \"Do you think gold is better?\" the giraffe muses, tilting its head. \"Gold is so shiny. And, like, have you seen how cool it looks?\"",
                "Danny: \"Huh. But I do like staying warm. And like... civilization runs on coal, huh?\" It taps its hoof, deep in thought.",
                "Danny: It leans down, getting way too close to your face. \"So, buddy... what's the move?\""
            ],
            choices: [
                { text: "Gold is way better, jewelry and all the fine things in life involve gold", tileId: 90 },
                { text: "Coal is used for much more, it's necessary!", tileId: 58 }
            ]
        },
        60: { // Tile 60 - Bru
            npc: "Bru",
            dialogues: [
                "The soft sound of hooves shuffling in the casino carpet catches your attention. Standing in the middle of the casino is a lone sheep. Its wool is thick and slightly unkempt, as if it's been standing here for a long time. The sheep looks at you with wide, uncertain eyes.",
                "Bru: \"Hey...uhm...\" it murmurs, its voice gentle, almost hesitant. \"I didn't think I'd see anyone here. I don't get many visitors.\"",
                "Bru: He shuffles hoof to hoof, eyes staring away into the distance. \n\"I've just been standing here...thinking. Thinking for so long I almost forgot why I'm here. Hiding from HIM.\"",
                "Bru: The sheep lifts its head, eyes searching yours, almost pleading. \"Hey...you think you can answer this question and help me?\"\nIt nods toward the horizon where the path splits into two.",
                "Bru: \"To change, growth, and discovery!\" the sheep says, its voice trembling with both fear and excitement. \"Would you choose that? Or to stay the same...change is scary.\"",
                "Bru: The sheep looks at you again, this time with silent expectation. \n\"So...what do you think?\" it asks."
            ],
            choices: [
                { text: "Grow and change! You're meant to grow and learn!", tileId: 61 },
                { text: "Change is scary, I don't think I'm ready yet", tileId: 63 }
            ]
        },
        73: { // Tile 73 - Aly
            npc: "Aly",
            dialogues: [
                "As you make your way forward, a sudden flash of movement catches you eye. From the shadows, a slinky ferret appears into view, eyes shining with mischief. It circles you, tail flicking playfully.",
                "Aly: \"Hey there...What's a precious thing like you doing all the way out here?\" It tilts its head, smirking. \"Wouldn't want to stay too long, now. This place? It belongs to us. It belongs to HIM.\"",
                "You feel as though you're being watched from the shadows. The ferret grins wider, showing the hint of sharp teeth.",
                "Aly: \"Might eat you, y'know....but...\" It steps closer, placing a delicate paw on you. \"I wouldn't dream of hurting such a dapper fellow.\"",
                "Aly: \"Whadya say, then?\" it asks, voice smooth as honey. \"Wanna take a little look around? Just a peek won't hurt.\"",
                "Aly: \"Or no thanks? Suit yourself, traveller. But you'll always wonder what you missed\"",
                "The air is thick with silent invitation. The ferret steps aside, watching, waiting.",
                "Aly: \"So then... what's it gonna be?\""
            ],
            choices: [
                { text: "Sure...I guess...I feel kinda threatened", tileId: 82 },
                { text: "No thanks, just passing through", tileId: 74 }
            ]
        }
    };

    constructor(tile: Tile) {
        this.tile = tile;
    }

    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`DecisionEvent: Player ${playerId} not found.`);
            return;
        }

        // Decision tiles always trigger their event regardless of being a final step
        // as the decision itself is the primary interaction.

        const decisionData = this.decisionDialogues[this.tile.index];
        if (!decisionData) {
            console.log(`Player ${playerId} landed on Decision Tile ${this.tile.index}, but no specific dialogue is configured. Defaulting to path options.`);
            // Fallback to generic choice if specific dialogue isn't found
            const possiblePaths = this.tile.getFront();
            if (!possiblePaths || possiblePaths.length === 0) {
                console.log("No forward paths available from this decision point. Staying put.");
                return;
            }
            if (possiblePaths.length === 1) {
                console.log(`Only one path forward to tile ${possiblePaths[0]}. Moving automatically.`);
                // Pass true for isFinalStepInCall as this is the final landing in this fallback
                await player.move.to(possiblePaths[0], true);
                return;
            }
            const choices = possiblePaths.map(pathIndex => ({
                title: `Go to Tile ${pathIndex}`,
                value: pathIndex,
                disabled: false
            }));
            const response = await prompts({
                type: 'select',
                name: 'chosenPath',
                message: 'Choose your path:',
                choices: choices
            });
            if (typeof response.chosenPath !== 'undefined') {
                 // Pass true for isFinalStepInCall as this is the final landing in this fallback
                await player.move.to(response.chosenPath, true);
            }
            return;
        }

        console.log(`\n--- Decision on Tile ${this.tile.index} ---`);
        for (const line of decisionData.dialogues) {
            console.log(line);
            // In a real UI, you'd click "next". For CLI, we can pause.
            await prompts({ type: 'text', name: 'continue', message: 'Press Enter to continue dialogue...' });
        }

        const promptChoices = decisionData.choices.map(choice => ({
            title: choice.text,
            value: choice.tileId
        }));

        const response = await prompts({
            type: 'select',
            name: 'chosenPath',
            message: `${decisionData.npc} awaits your decision:`,
            choices: promptChoices
        });

        if (typeof response.chosenPath !== 'undefined') {
            const chosenTileId = response.chosenPath;
            console.log(`Player ${playerId} chose path to Tile ${chosenTileId}.`);
            player.status.setResolvedDecisionPath(chosenTileId);

            // The remaining steps logic is now handled in the Movement class
            // We no longer need to check or log remaining steps here.
            // The Movement class will pick up the resolved path and remaining steps.

        } else {
            console.log(`Player ${playerId} made no choice. The path remains open as per map default.`);
        }
    }
}

// CURSED COFFIN EVENT (TYPE 9)
export class CursedCoffinEvent implements IEvent {
    name = "Cursed Coffin Trap";
    type = 9;
    description = "A previously placed Cursed Coffin trap springs!";
    effect = "You are forced into the cursed tomb. You are stuck here for 2 rounds!";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`CursedCoffinEvent: Player ${playerId} not found.`);
            return;
        }
        // Cursed Coffin trap triggers regardless of being a final step
        console.log(`Player ${playerId} stepped on tile ${this.tile.index} and triggered a Cursed Coffin trap!`);
        player.status.effectAdd("cursedCoffin_stun", 2); // Stun for 2 turns
        console.log(`Player ${playerId} is stunned by the Cursed Coffin for 2 rounds.`);
        this.tile.setEvent(0, this.tile); // Revert to NothingEvent
        console.log(`Cursed Coffin trap removed from tile ${this.tile.index}. It now has a NothingEvent.`);
    }
}

// BOSS BATTLE EVENT (NEW TYPE 10) - Placeholder for Spindle
export class BossBattleEvent implements IEvent {
    name = "Boss Battle";
    type = 10;
    description = "The air grows heavy... Spindle appears!";
    effect = "Face the ultimate villain!";
    tile: Tile;

    constructor(tile: Tile) { this.tile = tile; }

    public async onStep(playerId: number, game: Game, isFinalStepInCall: boolean): Promise<void> {
        const player = game.players.find(p => p.id === playerId);
        if (!player) {
            console.error(`BossBattleEvent: Player ${playerId} not found.`);
            return;
        }
        // Boss battle triggers regardless of being a final step
        console.log(`\n !!! Player ${playerId} has reached Tile ${this.tile.index} and confronts SPINDLE !!!`);
        console.log("(Boss Battle logic to be implemented. For now, player wins by reaching here!)");
        game.setWinner(player);
    }
}

// Event Factory
export class EventFactory {
    public static createEvent(type: number, tile: Tile): IEvent {
        switch (type) {
            case 0: return new NothingEvent(tile);
            case 1: return new SafeEvent(tile);
            case 2: return new BattleEvent(tile); // Regular battle (vs Wim)
            case 3: return new BattleEffectEvent(tile);
            case 4: return new ItemEvent(tile);
            case 5: return new ShopEvent(tile); // Changed from StoryEvent
            case 6: return new SlotsEvent(tile);
            case 7: return new MiningEvent(tile);
            case 8: return new DecisionEvent(tile);
            case 9: return new CursedCoffinEvent(tile);
            case 10: return new BossBattleEvent(tile); // Boss battle (vs Spindle)
            default:
                console.warn(`EventFactory: Unknown event type ${type} requested for tile ${tile.index}. Defaulting to NothingEvent.`);
                return new NothingEvent(tile);
        }
    }
}
