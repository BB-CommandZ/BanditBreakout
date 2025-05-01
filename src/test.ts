import Map from "./areas/Map/Map";
import Game from "./areas/Types/Game";
import Player from "./areas/Types/Player";

const game = new Game();

game.startGame(4, "ABC123");

// console.log("Game started with players:")
// console.log(game.players)

// console.log("Players are at positions:")
// console.log(game.map.playerPositions)

// let tile0 = game.map.tiles[0]

// console.log("Map tile 0:")
// console.log(tile0)

console.log("map tile 5 players:")
console.log(game.map.tiles[5].playersOnTile)

let p1 = game.players[0]
p1.move.front(5)

console.log("map tile 5 players:")
console.log(game.map.tiles[5].playersOnTile)

console.log("map tile 2 players:")
console.log(game.map.tiles[2].playersOnTile)

let p2 = game.players[1]
p2.move.to(2)

console.log("map tile 2 players:")
console.log(game.map.tiles[2].playersOnTile)

p1.move.back(1)

console.log("map tile 4 players:")
console.log(game.map.tiles[4].playersOnTile)







// console.log("***")
// console.log("***")
// console.log("***")

// console.log("Testing event")
// let p1 = game.players[0]
// console.log("Player 1's gold:")
// console.log(p1.getGold())
// console.log("Player 1 steping on safe")
// game.move.playerTo(1, 2)
// console.log("Player 1's gold:")
// console.log(p1.getGold())


//note the player positions are empty because tiles have them. they need to be link somehow TODO

console.log("\n*** Testing events ***\n");

// Example: Move Player 1 to a Safe tile (should gain 3 gold)
let player = game.players[0];
console.log(`Player 1 initial gold: ${player.getGold()}`);
player.move.to(1); // Tile 1 is Safe according to your mapping
game.map.tiles[1].getEvent().onStep(player.id, game);
console.log(`Player 1 gold after Safe event: ${player.getGold()}`);

// Example: Move Player 1 to a Mining tile (should gain 5-10 gold)
player.move.to(94); // Mining tile
game.map.tiles[94].getEvent().onStep(player.id, game);
console.log(`Player 1 gold after Mining event: ${player.getGold()}`);

// Example: Move Player 2 to a Slots tile (should gain/lose gold)
let player2 = game.players[1];
player2.move.to(23); // Slots tile
game.map.tiles[23].getEvent().onStep(player2.id, game);
console.log(`Player 2 gold after Slots event: ${player2.getGold()}`);

// Example: Move Player 3 to an Item tile (should get an item)
let player3 = game.players[2];
player3.move.to(4); // Item tile
game.map.tiles[4].getEvent().onStep(player3.id, game);
console.log(`Player 3 inventory after Item event:`, player3.getInventory().map(item => item.name));

// Example: Move Player 4 to a Battle Effect tile (should get a battle buff)
let player4 = game.players[3];
player4.move.to(7); // Battle Effect tile
game.map.tiles[7].getEvent().onStep(player4.id, game);
console.log(`Player 4 effects after Battle Effect event:`, player4.getEffect());

