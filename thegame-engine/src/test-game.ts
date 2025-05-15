import Game from './areas/Types/Game';

async function testGame() {
    console.log('Testing Game initialization...');
    try {
        const game = new Game();
        console.log('Game instance created successfully');
        console.log('Testing map initialization...');
        game.startGame(2, 'test-session');
        console.log('Game started with 2 players');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testGame().catch(err => console.error('Unhandled error:', err));
