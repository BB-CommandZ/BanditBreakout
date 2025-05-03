import { IEvent, NothingEvent, EventFactory } from './Event';
import Player from './Player';

/**
 * Represents a single tile on the game map
 * 
 * Tiles make up the game board
 * May contain events that trigger when a player lands on them.
 */
export default class Tile {
    index: number;
    hasPlayerOnTile: boolean;
    playersOnTile: number[]
    event: IEvent;
    connections: number[];
    back: number[] = [];
    front: number[] = [];
    /**
     * Creates a new Tile instance
     * 
     * @param index - Index on the game map
     * @param hasPlayer - Whether a player is currently on this tile (defaults to false)
     * @param event - Event (defaults to Nothing). Can be set
     * @param connections - Array of tile indexes connected to the tile
     */
    constructor(index: number) {
        this.index = index;
        this.hasPlayerOnTile = false;
        this.playersOnTile = []
        this.event = new NothingEvent(this);
        this.connections = [];
        
    }

    //  TILE INDEX RELATED METHODS

    public getIndex(): number {
        return this.index;
    }


    public setIndex(index: number): void {
        this.index = index;
    }

    // TILE CONNECTION RELATED METHODS

    public getConnections(): number[] {
        return this.connections;
    }

    public connectTo(tileIndex: number): void {
        if (!this.connections.includes(tileIndex)) {
            this.connections.push(tileIndex);
        }
    }

    // BACK AND FRONT RELATED METHODS

    public setBack(tileIndexArray: number[]) {
        this.back = tileIndexArray;
    }
    
    public setFront(tileIndexArray: number[]) {
        this.front = tileIndexArray;
    }
    
    public getBack(): number[] {
        return this.back;
    }
    
    public getFront(): number[] {
        return this.front;
    }

    // PLAYER RELATED METHODS

    public hasPlayer(): boolean {
        return this.hasPlayerOnTile;
    }

    public getPlayersOnTile(): number[] {
        return this.playersOnTile;
    }

    public addPlayer(player_id: number): void {
        this.playersOnTile.push(player_id);
        this.hasPlayerOnTile = true;
    }

    public removePlayer(player_id: number): void {
        const index = this.playersOnTile.indexOf(player_id);
        if (index > -1) {
            this.playersOnTile.splice(index, 1);
        }
        if (this.playersOnTile.length === 0) {
            this.hasPlayerOnTile = false;
        }
    }


    //  EVENT RELATED METHODS

    public getEvent(): IEvent {
        return this.event;
    }

    public hasEvent(): boolean {
        return this.event.type !== 0;
    }

    /**
     * Set an event on this tile by event type
     * @param eventType - The type of event to set
     * @param tile - The tile
     * - 0: NothingEvent
     * - 1: SafeEvent
     * - 2: BattleEvent
     * - 3: BattleEffectEvent
     * - 4: ItemEvent
     * - 5: StoryEvent
     * - 6: SlotsEvent
     * - 7: MiningEvent
     * - 8: DecisionEvent
     * @returns True if the event was set successfully
     */
    public setEvent(eventType: number, tile: Tile): boolean {
        this.event = EventFactory.createEvent(eventType, tile);
        return true;
    }
    
}