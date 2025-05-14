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
    public async to(tileIndex: number): Promise<void> {
        const currentTileId = this.game.map.findPlayer(this.player.id);
        if (currentTileId !== -1) {
            this.game.map.tiles[currentTileId].removePlayer(this.player.id);
        }

        if (tileIndex < 0 || tileIndex >= this.game.map.tiles.length) {
            console.error(`Error: Player ${this.player.id} tried to move to invalid tile index ${tileIndex}. Staying put.`);
            if (currentTileId !== -1) {
                 this.game.map.tiles[currentTileId].addPlayer(this.player.id);
            }
            return;
        }
        
        const targetTile = this.game.map.tiles[tileIndex];
        targetTile.addPlayer(this.player.id);
        console.log(`Player ${this.player.id} moved to Tile ${tileIndex}.`);

        // Trigger event of the new tile
        await targetTile.getEvent().onStep(this.player.id, this.game);

        // Check for multiple players on the same tile to trigger a battle
        const playersOnNewTile = targetTile.getPlayersOnTile();
        if (playersOnNewTile.length > 1) {
            console.log(`Multiple players on Tile ${tileIndex}! A battle commences between two random players!`);
            const battlingPlayersIds = [...playersOnNewTile].sort(() => 0.5 - Math.random()).slice(0, 2);
            if (battlingPlayersIds.length === 2) {
                const player1 = this.game.players.find(p => p.id === battlingPlayersIds[0]);
                const player2 = this.game.players.find(p => p.id === battlingPlayersIds[1]);
                if (player1 && player2) {
                    console.log(`Player ${player1.id} vs Player ${player2.id}!`);
                    console.log("(Player vs Player battle logic for landing on same tile to be implemented)");
                }
            }
        }
    }
    
    /**
     * Moves all players to a specific Tile
     * @param tile - The tile index
     */
    public async playerAndEveryoneTo(tile: number): Promise<void> {
        for (const player of this.game.players) {
            await this.to(tile);
        }
    }

    /**
     * Swaps two players on the map
     * @param targetPlayer - The player to swap with
     */
    public async swap(targetPlayer: Player): Promise<void> {
        const myTileId = this.game.map.findPlayer(this.player.id);
        const targetTileId = this.game.map.findPlayer(targetPlayer.id);

        if (myTileId === -1 || targetTileId === -1) {
            console.log("Cannot swap, one or both players not found on map.");
            return;
        }

        console.log(`Player ${this.player.id} (on tile ${myTileId}) swapping with Player ${targetPlayer.id} (on tile ${targetTileId})`);

        // Temporarily remove both to avoid conflicts
        this.game.map.tiles[myTileId].removePlayer(this.player.id);
        this.game.map.tiles[targetTileId].removePlayer(targetPlayer.id);

        await this.to(targetTileId);
        await targetPlayer.move.to(myTileId);

        console.log(`Swap complete. Player ${this.player.id} is now on ${targetTileId}, Player ${targetPlayer.id} is now on ${myTileId}.`);
    }

    public async front(by: number): Promise<void> {
        console.log(`Player ${this.player.id} attempting to move forward by ${by} steps.`);
        let currentTileId = this.game.map.findPlayer(this.player.id);

        for (let i = 0; i < by; i++) {
            if (!this.player.isAlive) {
                console.log(`Player ${this.player.id} cannot move further as they are not alive.`);
                break;
            }
            if (this.player.status.isStunned()) {
                console.log(`Player ${this.player.id} is stunned and cannot complete their move!`);
                break; 
            }

            if (currentTileId === -1) {
                console.error(`Player ${this.player.id} is not on the map. Cannot move.`);
                return;
            }
            const currentTile = this.game.map.tiles[currentTileId];
            let frontArray = currentTile.getFront();
            let nextTileId: number | null = null;

            // Handle Decision Tile Logic
            if (currentTile.getEvent().type === 8) { // If currently on a Decision Tile
                const resolvedPath = this.player.status.getResolvedDecisionPath();
                if (resolvedPath !== null) {
                    console.log(`Continuing movement using resolved decision path to: Tile ${resolvedPath}`);
                    nextTileId = resolvedPath;
                    this.player.status.clearResolvedDecisionPath(); // Consume the resolved path for this step
                } else {
                    console.warn(`Player ${this.player.id} on Decision Tile ${currentTileId} but no path resolved. Defaulting.`);
                    if (frontArray.length > 0) {
                        nextTileId = frontArray[0]; // Default to first path if not resolved
                    } else {
                        console.log(`Player ${this.player.id} is at a dead end on Tile ${currentTileId} (no front paths).`);
                        break; // Stop movement
                    }
                }
            } else { // Not a decision tile, or decision already handled
                if (frontArray.length === 0) {
                    console.log(`Player ${this.player.id} is at a dead end on Tile ${currentTileId} (no front paths).`);
                    if (currentTileId === 43 && currentTile.getEvent().type === 10) { // BossBattleEvent
                        console.log(`Player ${this.player.id} has reached the Boss Tile ${currentTileId}!`);
                    }
                    break; // Stop movement
                }
                if (frontArray.length > 1) {
                    console.warn(`Warning: Tile ${currentTileId} has multiple front paths but is not a Decision tile. Taking first path.`);
                    nextTileId = frontArray[0];
                } else {
                    nextTileId = frontArray[0];
                }
            }

            if (nextTileId === null || typeof nextTileId === 'undefined') {
                 console.log(`Player ${this.player.id} cannot determine next tile from ${currentTileId}. Stopping movement.`);
                 break;
            }

            console.log(`Step ${i + 1} of ${by}: Moving from ${currentTileId} to ${nextTileId}`);
            
            // Check if next tile is a Decision tile (type 8)
            const nextTile = this.game.map.tiles[nextTileId];
            if (nextTile.getEvent().type === 8) {
                // Always trigger Decision tile events immediately
                await this.to(nextTileId);
                currentTileId = this.game.map.findPlayer(this.player.id);
                break; // Stop movement to let player make choice
            }
            // For non-decision tiles, only trigger event on final step
            else if (i === by - 1) {
                await this.to(nextTileId);
            } else {
                // Silent move without triggering event
                const currentTileId = this.game.map.findPlayer(this.player.id);
                if (currentTileId !== -1) {
                    this.game.map.tiles[currentTileId].removePlayer(this.player.id);
                }
                this.game.map.tiles[nextTileId].addPlayer(this.player.id);
                console.log(`Player ${this.player.id} moved silently to Tile ${nextTileId}`);
            }
            
            currentTileId = this.game.map.findPlayer(this.player.id);

            if (this.game.getWinner()) {
                console.log("A winner has been declared! Stopping further movement.");
                break;
            }
        }
        console.log(`Player ${this.player.id} finished their movement phase.`);
    }

public async back(by: number): Promise<void> {
    console.log(`Player ${this.player.id} moving backward by ${by} steps.`);
    let currentTileId = this.game.map.findPlayer(this.player.id);

    for (let i = 0; i < by; i++) {
         if (!this.player.isAlive) break; // Stop if player is no longer alive
        if (currentTileId === -1) {
            console.error("Player not found on map, cannot move back.");
            return;
        }
        const currentTile = this.game.map.tiles[currentTileId];
        const backArray = currentTile.getBack();

        if (backArray.length === 0) {
            console.log(`Player ${this.player.id} is at the rearmost Tile ${currentTileId} (no back paths).`);
            break; // Stop movement
        }
        // Assuming back paths are never choices for simplicity, take the first.
        const nextTileId = backArray[0];
        await this.to(nextTileId);
        currentTileId = this.game.map.findPlayer(this.player.id);
    }
}


private rollDiceNum(): number {
    // Check for rigged dice effect
    const riggedRoll = this.player.status.getNextDiceRoll();
    if (riggedRoll !== null) {
        console.log(`Using rigged dice roll of ${riggedRoll} for Player ${this.player.id}.`);
        this.player.status.effectRemove("rigged_dice_active");
        return riggedRoll;
    }
    return Math.floor(Math.random() * 6) + 1;
}

public async diceRoll(): Promise<void> {
    const dice = this.rollDiceNum();
    console.log(`Player ${this.player.id} rolled a ${dice}!`);
    await this.player.move.front(dice);
}
}
