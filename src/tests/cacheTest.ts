import { getFromCache, setToCache, invalidateCache } from '../cache';
import { connectToDatabase, disconnectFromDatabase } from '../db/mongoose';
import { createGame, getGame } from '../db/operations/gameOps';
import { GameModel } from '../db/models/GameModel';

async function cleanUpDatabase() {
    try {
        await GameModel.deleteMany({});
        console.log('✓ Cleared existing games');
    } catch (error) {
        console.error('Error cleaning up database:', error);
        throw error;
    }
}

async function runCacheTests() {
    console.log('Starting Redis cache tests...\n');
    
    try {
        // Test 1: Set and Get simple data from cache
        console.log('Test 1: Setting and getting simple data from cache...');
        const testKey = 'test:simple';
        const testData = { message: 'Hello, Redis!' };
        await setToCache(testKey, testData, 60); // 1 minute TTL
        const cachedData = await getFromCache(testKey);
        if (cachedData && cachedData.message === testData.message) {
            console.log('✓ Test 1 passed: Successfully set and retrieved data from cache\n');
        } else {
            console.error('✗ Test 1 failed: Data mismatch or not found in cache\n');
            process.exit(1);
        }

        // Test 2: Cache expiration
        console.log('Test 2: Testing cache expiration...');
        const expireKey = 'test:expire';
        await setToCache(expireKey, { expiring: true }, 2); // 2 seconds TTL
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for 3 seconds
        const expiredData = await getFromCache(expireKey);
        if (expiredData === null) {
            console.log('✓ Test 2 passed: Cache entry expired as expected\n');
        } else {
            console.error('✗ Test 2 failed: Cache entry did not expire\n');
            process.exit(1);
        }

        // Test 3: Cache invalidation
        console.log('Test 3: Testing cache invalidation...');
        const invalidateKey = 'test:invalidate';
        await setToCache(invalidateKey, { toInvalidate: true }, 60);
        await invalidateCache(invalidateKey);
        const invalidatedData = await getFromCache(invalidateKey);
        if (invalidatedData === null) {
            console.log('✓ Test 3 passed: Cache entry invalidated successfully\n');
        } else {
            console.error('✗ Test 3 failed: Cache entry was not invalidated\n');
            process.exit(1);
        }

        // Test 4: Integration with game operations
        console.log('Test 4: Testing cache integration with game operations...');
        await connectToDatabase();
        await cleanUpDatabase();
        const gameId = 'test-game-' + Date.now();
        const createdGame = await createGame(gameId, 'Test Game');
        const cachedGame = await getGame(gameId);
        if (cachedGame && cachedGame.game_id === gameId) {
            console.log('✓ Test 4 passed: Game data cached and retrieved successfully\n');
        } else {
            console.error('✗ Test 4 failed: Game data not cached properly\n');
            process.exit(1);
        }

        console.log('All cache tests passed successfully!\n');
    } catch (error) {
        console.error('Error during cache tests:', error);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
        process.exit(0);
    }
}

// Run the tests
runCacheTests();
