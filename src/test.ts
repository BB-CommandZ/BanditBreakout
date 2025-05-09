import Game from "./areas/Types/Game";

// GAME START

const game = new Game();
game.startGame(4, "ABC123");

let p1 = game.players[0]
let p2 = game.players[1]
let p3 = game.players[2]
let p4 = game.players[3]

console.log("****************************")
console.log("Map tile 0:")
console.log(game.map.tiles[0])

console.log("Map tile 3 players:")
console.log(game.map.tiles[3].playersOnTile)




p1.move.to(3)
p2.move.front(3)

p3.inventory.obtain(4)
p3.inventory.useItem(4, p1)


console.log("Map tile 3 players:")
console.log(game.map.tiles[3].playersOnTile)

console.log("****************************")
console.log("Player 1's gold before change:")
console.log(p1.getGold())

p1.setGold(p1.getGold() + 3)

console.log("Player 1's gold after:")
console.log(p1.getGold())

console.log("Player 1's health before change:")
console.log(p1.getHealth())
p1.health('=101')

console.log("Player 1's health after:")
console.log(p1.getHealth())

console.log("****************************")

console.log("Tile with 2 front:")
console.log(game.map.tiles[28])

console.log("Tile with 1 front:")
console.log(game.map.tiles[1])

console.log("****************************")
console.log("Dice roll")
console.log(game.map.findPlayer(p1.id))
p1.move.diceRoll()
console.log(game.map.findPlayer(p1.id))


// console.log("Game started with players:")
// console.log(game.players)

// console.log("Players are at positions:")
// console.log(game.map.playerPositions)

// let tile0 = game.map.tiles[0]

// console.log("Map tile 0:")
// console.log(tile0)

// console.log("map tile 5 players:")
// console.log(game.map.tiles[5].playersOnTile)

// let p1 = game.players[0]
// p1.move.front(5)

// console.log("map tile 5 players:")
// console.log(game.map.tiles[5].playersOnTile)

// console.log("map tile 2 players:")
// console.log(game.map.tiles[2].playersOnTile)

// let p2 = game.players[1]
// p2.move.to(2)

// console.log("map tile 2 players:")
// console.log(game.map.tiles[2].playersOnTile)

// p1.move.back(1)

// console.log("map tile 4 players:")
// console.log(game.map.tiles[4].playersOnTile)





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
