import { connectToDatabase, disconnectFromDatabase } from '../db/mongoose';
import { createPlayer, getPlayer, updatePlayerPosition, updatePlayerStatus, addItemToInventory } from '../db/operations/playerOps';
import { createGame, getGame, addPlayerToGame, updateGameMap } from '../db/operations/gameOps';
import { PlayerModel } from '../db/models/PlayerModel';
import { GameModel } from '../db/models/GameModel';

async function cleanUpDatabase() {
    try {
        await PlayerModel.deleteMany({});
        console.log('✓ Cleared existing players');
        await GameModel.deleteMany({});
        console.log('✓ Cleared existing games');
    } catch (error) {
        console.error('Error cleaning up database:', error);
        throw error;
    }
}

async function runTests() {
    try {
        // Test 1: Connect to Database
        console.log('Test 1: Connecting to database...');
        await connectToDatabase();
        console.log('✓ Database connection successful\n');

        // Clean up existing data
        console.log('Cleaning up existing data...');
        await cleanUpDatabase();
        console.log('✓ Database cleanup completed\n');

        // Test 2: Create a Player
        console.log('Test 2: Creating a player...');
        const player = await createPlayer('test-game-001', 1);
        console.log('✓ Player created:', player.player_id, '\n');

        // Test 3: Retrieve a Player
        console.log('Test 3: Retrieving player...');
        const retrievedPlayer = await getPlayer(1);
        console.log('✓ Player retrieved:', retrievedPlayer?.player_id, '\n');

        // Test 4: Update Player Position
        console.log('Test 4: Updating player position...');
        const updatedPositionPlayer = await updatePlayerPosition(1, 5);
        console.log('✓ Player position updated to:', updatedPositionPlayer?.position, '\n');

        // Test 5: Update Player Status
        console.log('Test 5: Updating player status...');
        const updatedStatusPlayer = await updatePlayerStatus(1, { gold: 100, health: 50 });
        console.log('✓ Player status updated - Gold:', updatedStatusPlayer?.status.gold, 'Health:', updatedStatusPlayer?.status.health, '\n');

        // Test 6: Add Item to Inventory
        console.log('Test 6: Adding item to player inventory...');
        const item = {
            id: 1,
            name: 'Health Potion',
            description: 'Restores 20 health points',
            effect: '+20 health',
            isBattleItem: false,
            isUsable: true
        };
        const updatedInventoryPlayer = await addItemToInventory(1, item);
        console.log('✓ Item added to inventory:', updatedInventoryPlayer?.inventory[0].name, '\n');

        // Test 7: Create a Game
        console.log('Test 7: Creating a game...');
        const game = await createGame('test-game-001', 'Test Game');
        console.log('✓ Game created:', game.game_id, '\n');

        // Test 8: Retrieve a Game
        console.log('Test 8: Retrieving game...');
        const retrievedGame = await getGame('test-game-001');
        console.log('✓ Game retrieved:', retrievedGame?.game_id, '\n');

        // Test 9: Add Player to Game
        console.log('Test 9: Adding player to game...');
        const updatedGame = await addPlayerToGame('test-game-001', 1);
        console.log('✓ Player added to game. Players in game:', updatedGame?.players, '\n');

        // Test 10: Update Game Map
        console.log('Test 10: Updating game map...');
        const tiles = [
            { position: 0, hasPlayerOnTile: true, playersOnTile: [1], hasEvent: false, event: { name: 'Nothing', type: 0, description: 'Nothing happens here', effect: 'No effect' } },
            { position: 1, hasPlayerOnTile: false, playersOnTile: [], hasEvent: false, event: { name: 'Nothing', type: 0, description: 'Nothing happens here', effect: 'No effect' } }
        ];
        const updatedMapGame = await updateGameMap('test-game-001', tiles);
        console.log('✓ Game map updated. Tiles count:', updatedMapGame?.map.tiles.length, '\n');

        console.log('All tests completed successfully!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up: Disconnect from database
        console.log('\nCleaning up: Disconnecting from database...');
        await disconnectFromDatabase();
        console.log('✓ Database disconnection successful');
    }
}

// Run the tests
runTests();
