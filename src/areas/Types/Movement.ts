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
     * @param isFinalStepInCall - Whether this is the final step in the current movement call
     */
    public async to(tileIndex: number, isFinalStepInCall: boolean): Promise<void> {
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

        // Trigger event of the new tile, passing whether this is the final step
        // Trigger event of the new tile, passing whether this is the final step
        await targetTile.getEvent().onStep(this.player.id, this.game, isFinalStepInCall);

        // Check for multiple players on the same tile to trigger a battle ONLY if this is the final step
        if (isFinalStepInCall) {
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
    }

    /**
     * Moves all players to a specific Tile
     * @param tile - The tile index
     */
    public async playerAndEveryoneTo(tile: number): Promise<void> {
        for (const player of this.game.players) {
            // Assuming this is a final move for all players in this context
            await this.to(tile, true);
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

        // Pass true for isFinalStepInCall as these are the final landing spots after a swap
        await this.to(targetTileId, true);
        await targetPlayer.move.to(myTileId, true);

        console.log(`Swap complete. Player ${this.player.id} is now on ${targetTileId}, Player ${targetPlayer.id} is now on ${myTileId}.`);
    }

    public async front(by: number, originalRoll?: number): Promise<void> {
        const totalSteps = originalRoll !== undefined ? originalRoll : by;
        console.log(`Player ${this.player.id} attempting to move forward by ${by} steps.`);
        this.player.status.setMidMovement(true);
        let currentTileId = this.game.map.findPlayer(this.player.id);

        // Check for stored path from previous decision
        const resolvedPath = this.player.status.getResolvedDecisionPath();
        const remainingSteps = this.player.status.getRemainingStepsAfterDecision();
        if (resolvedPath !== null && remainingSteps !== null) {
            console.log(`Continuing movement from previous decision to Tile ${resolvedPath} with ${remainingSteps} steps remaining`);
            
            // Move to chosen path (does NOT count as a step)
            // This is a single move to the resolved path before potentially starting a new sequence
            await this.to(resolvedPath, true); // Pass true for isFinalStepInCall
            this.player.status.clearResolvedDecisionPath();
            
            // Continue with all remaining steps
            if (remainingSteps > 0) {
                console.log(`Continuing with ${remainingSteps} remaining steps after path choice`);
                // Recursive call to continue movement with remaining steps
                // The final step logic will be handled within this recursive call
                await this.front(remainingSteps);
            }
            
            this.player.status.clearRemainingStepsAfterDecision();
            this.player.status.setMidMovement(false); // Ensure movement ends after this continuation
            return; // Exit this call as movement is handled by the recursive call
        }
        // --- End of existing logic ---


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

            // Determine if this is the final step in this specific front() call
            const isFinalStepInThisCall = (i === by - 1);

            // Move to the next tile and trigger its event, passing if it's the final step
            await this.to(nextTileId, isFinalStepInThisCall);

            currentTileId = this.game.map.findPlayer(this.player.id); // Update current position after move

            // Check if the tile we just moved *to* is a Decision Tile (type 8)
            const landedTile = this.game.map.tiles[currentTileId];
            if (landedTile.getEvent().type === 8) {
                 console.log(`Player ${this.player.id} landed on Decision Tile ${currentTileId}.`);
                 // The DecisionEvent.onStep has already been triggered by await this.to(nextTileId, isFinalStepInThisCall);
                 // and should have set resolvedDecisionPath and remainingStepsAfterDecision.

                 const resolvedPathAfterDecision = this.player.status.getResolvedDecisionPath();
                 const remainingStepsAfterDecision = this.player.status.getRemainingStepsAfterDecision();

                 if (resolvedPathAfterDecision !== null && remainingStepsAfterDecision !== null && remainingStepsAfterDecision > 0) {
                     console.log(`Decision made. Continuing movement from Tile ${currentTileId} to Tile ${resolvedPathAfterDecision} with ${remainingStepsAfterDecision} steps remaining.`);

                     // Adjust the loop counter 'i' to effectively skip the steps already taken
                     // and continue for the remaining steps.
                     // The number of steps remaining in the original roll is by - (i + 1).
                     // We need the loop to continue for remainingStepsAfterDecision more iterations.
                     // The loop condition is i < by.
                     // We need to adjust 'i' so that by - (i + 1) becomes remainingStepsAfterDecision.
                     // by - i - 1 = remainingStepsAfterDecision
                     // i = by - 1 - remainingStepsAfterDecision
                     i = by - 1 - remainingStepsAfterDecision; // Adjust loop counter

                     // Clear the status flags as they've been used for this continuation
                     this.player.status.clearResolvedDecisionPath();
                     this.player.status.clearRemainingStepsAfterDecision();

                     // The loop will continue from the adjusted 'i' value for the remaining steps.

                 } else {
                     console.log(`Decision made on Tile ${currentTileId}. No remaining steps or path resolved to continue movement this turn.`);
                     // If no remaining steps or no path resolved after decision, end movement phase.
                     this.player.status.setMidMovement(false);
                     return; // End movement phase
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
        // Pass whether this is the final step in this specific back() call
        const isFinalStepInThisCall = (i === by - 1);
        await this.to(nextTileId, isFinalStepInThisCall);
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
