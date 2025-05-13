import { create } from "domain";
import Tile from "../Types/Tile";
import { EOL } from "os";

// events
const eventTiles = {
    0: [0],
    1: [1, 2, 3, 6, 10, 12, 15, 18, 19, 26, 29, 31, 32, 34, 38, 39, 40, 45, 49, 51, 53, 58, 59, 63, 65, 67, 74, 81, 86, 89, 90, 98, 101],
    2: [21, 27, 33, 42, 47, 52, 56, 61, 66, 70, 72, 75, 78, 79, 80, 84, 85, 91, 96, 102], // Regular battles
    3: [7, 14, 16, 20, 44, 50, 62, 71, 76, 87, 92], // Battle effect tiles
    10: [43], // Boss battle tile (Spindle)
    4: [4, 8, 9, 17, 22, 30, 36, 37, 41, 48, 55, 69, 77, 82, 83, 88, 93, 99],
    5: [11, 24, 35, 46, 64, 68, 100],
    6: [23, 25],
    7: [94, 97],
    8: [5, 13, 28, 54, 57, 60, 73]
};

// strainht paths
const connectionRanges = [
    [0, 43],
    [44, 62],
    [63, 66],
    [67, 82],
    [83, 90],
    [91, 99],
    [100, 102]
];

// intersections
const connectionPoints = [
    [5, 44],
    [9, 15],
    [13, 62],
    [55, 61],
    [60, 63],
    [28, 66],
    [28, 99],
    [39, 102],
    [100, 97],
    [88, 91],
    [54, 67],
    [79, 83],
    [73, 82],
    [57, 90]
];

// Front and back paths special cases
const tilePaths = {
    // Special intersections
    5: { b: [4], f: [6, 44] },
    13: { b: [12], f: [14, 62] },
    60: { b: [61], f: [61, 63] },
    54: { b: [53], f: [55, 67] },
    57: { b: [56], f: [58, 90] },
    73: { b: [72], f: [74, 82] },
    79: { b: [78, 80], f: [83] },
    88: { b: [87, 89], f: [91] },
    97: { b: [96, 98], f: [100] },
    39: { b: [38, 102], f: [40] },
    28: { b: [27, 66], f: [29, 99] },
    
    // Reverse numbered paths
    99: { b: [28], f: [98] },
    90: { b: [57], f: [89] },
    82: { b: [73], f: [81] },
    81: { b: [82], f: [80] },
    62: { b: [13], f: [61] },
    59: { b: [58], f: [58] },
    58: { b: [59], f: [57, 59] }
};


export default class Map {
    tiles: Tile[];
    playerPositions: number[];

    /**
     * Gets serializable map state
     */
    public getSaveData() {
        return {
            tiles: this.tiles.map(tile => ({
                index: tile.index,
                eventType: tile.getEvent()?.type ?? 0,
                players: tile.getPlayersOnTile(),
                connections: tile.getConnections()
            })),
            playerPositions: this.playerPositions
        };
    }

    /**
     * Loads map state from saved data
     */
    public loadFromSave(saveData: any) {
        // Recreate tiles
        this.tiles = [];
        this.createTiles(saveData.tiles.length);

        // Restore tile states
        saveData.tiles.forEach((tileData: any) => {
            const tile = this.tiles[tileData.index];
            tile.setEvent(tileData.eventType, tile);
            tileData.players.forEach((playerId: number) => tile.addPlayer(playerId));
            
            // Reconnect tiles
            tileData.connections.forEach((connectedIndex: number) => {
                tile.connectTo(connectedIndex);
            });
        });

        // Restore player positions
        this.playerPositions = [...saveData.playerPositions];
    }

    constructor() {
        console.log('Map constructor called');
        try {
            this.tiles = [];
            this.playerPositions = [];
            console.log('Map base initialized');
        } catch (err) {
            console.error('Map construction failed:', err);
            throw err;
        }
    }

    // INITIALIZE MAP, MAIN FUNCTION
    
    public initializeMap(playerCount: number) {
        // actual tiles + 1 since there is tile 0
        this.createTiles(103);
        this.connectMap()
        this.assignPathDirections();
        this.eventMap()
        this.setPlayerPosAll(0, this.countPlayers(playerCount));
        this.updateMap()

        console.log(`Map initialized${EOL}`)
    }

    // UPDATING MAP (REFRESH)

    public updateMap() {
        //later TODO
    }

    // PRIVATE METHODS FOR INITIALIZATION

    // PLAYERS RELATED METHODS

    private countPlayers(playerCount: number) {
        let playersArray: number[] = []
        for (let i = 1; i <= playerCount; i++) {
            playersArray.push(i)
        }
        return playersArray
        console.log(`Players counted, there are ${playersArray.length}`)
    }
    
    private setPlayerPosAll(pos: number, playerIds: number[]) {
        let tile = this.tiles[pos];
        tile.hasPlayerOnTile = true;
        playerIds.forEach(player_Id => tile.addPlayer(player_Id))
        console.log(`Set player positions to start${EOL}`)
    }
    
    // helper for looking up player position
    public findPlayer(playerId: number): number {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].hasPlayer()) {
                let playersOnTile = this.tiles[i].getPlayersOnTile();
                if (playersOnTile.includes(playerId)) {
                    return i;
                }
            }
        }
        return -1;
    }

    // TILE RELATED METHODS

    private createTiles(tilesAmount: number) {
        for (let i = 0; i < tilesAmount; i++) {
            this.tiles.push(new Tile(i));
        }
        console.log(`Created tiles${EOL}`)
    }

    private connectTiles(from: number, to: number): void {
        this.tiles[from].connectTo(to);
        this.tiles[to].connectTo(from);
        console.log(`Connected tile ${from} to tile ${to}`)
    }

    private connectRange = (start: number, end: number) => {
        for (let i = start; i < end; i++) {
            this.connectTiles(i, i + 1);
        }
    };

    private connectMap() {
        // straigth paths
        connectionRanges.forEach(([start, end]) => {
            this.connectRange(start, end);
        });

        // intersections
        connectionPoints.forEach(([from, to]) => {
            this.connectTiles(from, to);
        });

        console.log(`Connected map${EOL}`)
    }

    private assignPathDirections() {

        this.assignStraightPath(0, 5);
        this.assignStraightPath(5, 13, true);
        this.assignStraightPath(13, 28, true);
        this.assignStraightPath(28, 43, true);
        
        this.assignStraightPath(44, 53);
        this.assignStraightPath(55, 56);
        this.assignStraightPath(67, 72);
        this.assignStraightPath(74, 78);
        this.assignStraightPath(83, 87);
        this.assignStraightPath(91, 96);
        this.assignStraightPath(100, 102);
        this.assignStraightPath(63, 66);
        
        // special cases
        Object.entries(tilePaths).forEach(([tileIndex, paths]) => {
            const index = parseInt(tileIndex);
            this.tiles[index].setBack(paths.b);
            this.tiles[index].setFront(paths.f);
        });
        
        console.log(`Assigned path directions${EOL}`);
    }

    // skipStart is only for intersections
    private assignStraightPath(start: number, end: number, skipStart: boolean = false) {
        
        for (let i = skipStart ? start + 1 : start; i <= end; i++) {
            
            // Starting tile, omly set front
            if (i === start && !skipStart) {
                this.tiles[i].setFront([i + 1]);
                continue;
            }
            
            // Last tile, only set back
            if (i === end) {
                this.tiles[i].setBack([i - 1]);
                continue;
            }
            
            // Rest, set both
            this.tiles[i].setBack([i - 1]);
            this.tiles[i].setFront([i + 1]);
        }
    }

    // EVENTS RELATED METHODS

    public createEventOfType(type: number, tileIndex: number) {
        let tile = this.tiles[tileIndex];
        tile.setEvent(type, tile);
        console.log(`Set event of type ${type} on tile ${tileIndex}`)
        
    }

    private eventMap() {
        Object.entries(eventTiles).forEach(([type, indexes]) => {
            indexes.forEach(index => this.createEventOfType(parseInt(type), index));
        });
        console.log(`Created events on map${EOL}`)
    }

}
