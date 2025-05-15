import { EOL } from 'os';
import Game from './Game';
import Player from './Player';

export default class Move {
    private player: Player;
    private game: Game;
    
    constructor(player: Player) {
        this.player = player;
        this.game = this.player.game;
    }
    
    /**
     * Moves a specific player to a specific Tile
     * @param tile - The tile index
     */
    public to(tile: number): void {
        const currentPos = this.game.map.findPlayer(this.player.id);
        
        if (currentPos !== -1) {
            this.game.map.tiles[currentPos].removePlayer(this.player.id);
            this.game.map.tiles[tile].addPlayer(this.player.id);
            
            this.game.map.tiles[tile].getEvent().onStep(this.player.id, this.game);
            
            console.log(`Moved player ${this.player.id} to tile ${tile}`);
        } else {
            console.error(`Player ${this.player.id} not found on the map. Dead or not in the game.`);
        }
    }
    
    /**
     * Moves all players to a specific Tile
     * @param tile - The tile index
     */
    public playerAndEveryoneTo(tile: number): void {
        for (const player of this.game.players) {
            this.to(tile);
        }
    }

    /**
     * Swaps two players on the map
     * @param player1 - The ID of the first player to swap
     */
    public swap(swapPlayer: Player): void {
        const tile1 = this.game.map.findPlayer(this.player.id);
        const tile2 = this.game.map.findPlayer(swapPlayer.id);

        if (tile1 !== -1 && tile2 !== -1) {
            this.to(tile2);
            swapPlayer.move.to(tile1);
            console.log(`Swapped players ${this.player.id} and ${swapPlayer}`);
        } else {
            console.error(`One or both players not found on the map.`);
        }
    }

    public front(by: number): { success: boolean; pendingChoice?: { options: number[]; stepsRemaining: number } } {
        let currentTile = this.game.map.findPlayer(this.player.id);
        if (currentTile === -1) {
            console.log(`Wrong tile, ${currentTile}`);
        }
        for (let i = 0; i < by; i++) {
            console.log(`Step ${i+1}/${by}: Player ${this.player.id} at tile ${currentTile}`);
            const frontArray = this.game.map.tiles[currentTile].getFront();
            console.log(`Forward options from tile ${currentTile}: [${frontArray.join(', ')}]`);

            if (frontArray.length === 0) {
                console.log(`THIS SHOULD CONNECT THE BOSS BATTLE - No forward connections found at tile ${currentTile}. Moving to tile 43.`); // TODO
                this.player.move.to(43)
                currentTile = 43

            } else if (frontArray.length > 1) {
                // Stop here and let the caller ask the player which path to take
                console.log(`Fork encountered at tile ${currentTile} with options [${frontArray.join(', ')}]`);
                // Log possible paths from this tile to potential destination tiles
                frontArray.forEach((option, index) => {
                    let path = [option];
                    let nextTile = option;
                    // Look ahead a few steps to see potential paths (limited to 6 steps for brevity)
                    for (let step = 0; step < 6; step++) {
                        const nextFront = this.game.map.tiles[nextTile].getFront();
                        if (nextFront.length > 0) {
                            nextTile = nextFront[0]; // Take the first option for simplicity
                            path.push(nextTile);
                        } else {
                            break;
                        }
                    }
                    console.log(`Possible path ${index + 1} from tile ${currentTile} via option ${option}: [${path.join(', ')}]`);
                });

                return {
                    success: false,
                    pendingChoice: { options: frontArray, stepsRemaining: by - i }
                };

            } else {
                console.log(`Moving player ${this.player.id} from tile ${currentTile} to tile ${frontArray[0]}`);
                this.player.move.to(frontArray[0])
                currentTile = frontArray[0];
            }
        }
        console.log(`Completed ${by} steps for player ${this.player.id}, final position: tile ${currentTile}`);
        return { success: true };
    }

public back(by: number): void {
    let currentTile = this.game.map.findPlayer(this.player.id);
    
    for (let i = 0; i < by; i++) {
        const backArray = this.game.map.tiles[currentTile].getBack();
        
        if (backArray.length === 0) {
            console.log(`player ${this.player.id} moved back to start`);
            this.player.move.to(0);
            currentTile = 0;
        } else if (backArray.length > 1) {
            let randomIndex = Math.floor(Math.random() * backArray.length);
            this.player.move.to(backArray[randomIndex]);
            currentTile = backArray[randomIndex];
        } else {
            this.player.move.to(backArray[0]);
            currentTile = backArray[0];
        }
    }
}


private rollDiceNum(): number {
    return Math.floor(Math.random() * 6) + 1;
}

public diceRoll(): { roll: number; pendingChoice?: { options: number[]; stepsRemaining: number } } {
    const dice = this.rollDiceNum();
    console.log(`Player ${this.player.id} rolled a ${dice}!`);
    const frontResult = this.front(dice);
    if (!frontResult.success) {
        return { roll: dice, pendingChoice: frontResult.pendingChoice };
    }
    return { roll: dice };
}
}
