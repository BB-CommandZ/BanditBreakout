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
     * @param tileIndex - The tile index
     * @param totalStepsRemainingInSequence - The total number of steps remaining in the overall movement sequence after landing on this tile
     */
    public async to(tileIndex: number, totalStepsRemainingInSequence: number): Promise<void> {
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

        // Trigger event of the new tile, passing the total steps remaining
        await targetTile.getEvent().onStep(this.player.id, this.game, totalStepsRemainingInSequence);

        // Check for multiple players on the same tile to trigger a battle ONLY if this is the final step of the sequence
        if (totalStepsRemainingInSequence === 0) {
            const playersOnNewTile = targetTile.getPlayersOnTile();
            if (playersOnNewTile.length > 1) {
                console.log(`Multiple players on Tile ${tileIndex}! A battle commences between two random players!`);
                const battlingPlayersIds = [...playersOnNewTile].sort(() => 0.5 - Math.random()).slice(0, 2);
                if (battlingPlayersIds.length === 2) {
                    const player1 = this.game.players.find(p => p.id === battlingPlayersIds[0]);
                    const player2 = this.game.players.find(p => p.id === battlingPlayersIds[1]);
                    if (player1 && player2) {
                        console.log(`Player ${player1.id} vs Player ${player2.id}!`);
                        await this.game.startBattle(player1, player2, { initiator: this.player }); // Initiate PvP battle
                    }
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
            // This is a final move to a specific tile, so 0 steps remaining
            await this.to(tile, 0);
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

        // These are final landing spots after a swap, so 0 steps remaining
        await this.to(targetTileId, 0);
        await targetPlayer.move.to(myTileId, 0);

        console.log(`Swap complete. Player ${this.player.id} is now on ${targetTileId}, Player ${targetPlayer.id} is now on ${myTileId}.`);
    }

    public async front(by: number, originalRoll?: number): Promise<void> {
        const totalSteps = originalRoll !== undefined ? originalRoll : by;
        console.log(`Player ${this.player.id} attempting to move forward by ${by} steps.`);
        this.player.status.setMidMovement(true);
        let currentTileId = this.game.map.findPlayer(this.player.id);

        // --- Modified logic for current turn movement ---
        let stepsTakenInCurrentPhase = 0; // Track steps taken in the current front() call

        for (let i = 0; i < by; i++) {
            stepsTakenInCurrentPhase++; // Increment steps taken in this phase

            if (!this.player.isAlive) {
                console.log(`Player ${this.player.id} cannot move further as they are not alive.`);
                break;
            }
            if (this.player.status.isStunned()) {
                console.log(`Player ${this.player.id} is stunned and cannot complete their move!`);
                break;
            }

            currentTileId = this.game.map.findPlayer(this.player.id); // Get current position
            if (currentTileId === -1) {
                console.error(`Player ${this.player.id} is not on the map. Cannot move.`);
                this.player.status.setMidMovement(false); // Ensure movement phase ends on error
                return;
            }
            const currentTile = this.game.map.tiles[currentTileId];
            let frontArray = currentTile.getFront();
            let nextTileId: number | null = null;

            // Handle Decision Tile Logic
            if (currentTile.getEvent().type === 8) { // If currently on a Decision Tile
                 // This block is for when the player *starts* their movement phase on a decision tile,
                 // which shouldn't happen with the new logic, but keep defensively.
                 console.warn(`Player ${this.player.id} started movement on Decision Tile ${currentTileId}. This scenario should be reviewed.`);
                 // Fallback to default path if starting on a decision tile without a resolved path
                 if (frontArray.length > 0) {
                     nextTileId = frontArray[0];
                 } else {
                     console.log(`Player ${this.player.id} is at a dead end on Tile ${currentTileId} (no front paths).`);
                     break; // Stop movement
                 }

            } else { // Not a decision tile, or decision already handled in a previous step of this loop
                if (frontArray.length === 0) {
                    console.log(`Player ${this.player.id} is at a dead end on Tile ${currentTileId} (no front paths).`);
                    if (currentTileId === 43 && currentTile.getEvent().type === 10) { // BossBattleEvent
                        console.log(`Player ${this.player.id} has reached the Boss Tile ${currentTileId}!`);
                    }
                    break; // Stop movement
                }
                if (frontArray.length > 1) {
                    // This case should ideally be handled by a Decision Tile event,
                    // but if a non-decision tile has multiple paths, take the first.
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

            console.log(`Step ${stepsTakenInCurrentPhase} of ${by}: Moving from ${currentTileId} to ${nextTileId}`);

            // Calculate total steps remaining after landing on the next tile
            const totalStepsRemaining = by - (i + 1);

            // Move to the next tile and trigger its event, passing total steps remaining
            await this.to(nextTileId, totalStepsRemaining);

            currentTileId = this.game.map.findPlayer(this.player.id); // Update current position after move

            // Check if the tile we just moved *to* is a Decision Tile (type 8)
            const landedTile = this.game.map.tiles[currentTileId];
            if (landedTile.getEvent().type === 8) {
                 console.log(`Player ${this.player.id} landed on Decision Tile ${currentTileId}.`);
                 // The DecisionEvent.onStep has already been triggered by await this.to(nextTileId, isFinalStepInCall);
                 // and should have set resolvedDecisionPath.

                 const resolvedPathAfterDecision = this.player.status.getResolvedDecisionPath();
                 const stepsRemaining = by - (i + 1); // Calculate remaining steps

                 if (resolvedPathAfterDecision !== null && stepsRemaining > 0) {
                     console.log(`Decision made. Continuing movement along path to Tile ${resolvedPathAfterDecision} with ${stepsRemaining} steps remaining.`);
                     this.player.status.clearResolvedDecisionPath(); // Clear resolved path
                     this.player.status.clearRemainingStepsAfterDecision(); // Clear remaining steps (handled by recursive call)

                     // Move to the chosen path (first step of remaining movement)
                     // Total steps remaining after this move is stepsRemaining - 1
                     await this.to(resolvedPathAfterDecision, stepsRemaining - 1);

                     // Continue with the remaining steps recursively
                     await this.front(stepsRemaining - 1);

                     // End the current movement phase as it's handled by the recursive call
                     return;
                 } else {
                      console.log(`Decision made on Tile ${currentTileId}. No remaining steps or path resolved to continue movement this turn.`);
                      // End the current movement phase
                      this.player.status.setMidMovement(false);
                      return;
                 }
            }


            if (this.game.getWinner()) {
                console.log("A winner has been declared! Stopping further movement.");
                this.player.status.setMidMovement(false); // Ensure movement phase ends
                return; // End movement phase
            }
        }
        // --- End of modified logic ---

        console.log(`Player ${this.player.id} finished their movement phase.`);
        this.player.status.setMidMovement(false);
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
        // Calculate total steps remaining after landing on the next tile
        const totalStepsRemaining = by - (i + 1);

        // Pass total steps remaining to the to method
        await this.to(nextTileId, totalStepsRemaining);
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
        await this.player.move.front(dice, dice);
}
}
