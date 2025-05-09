import prompts from 'prompts';
import Game from './areas/Types/Game';
import Player from './areas/Types/Player';
import fs from 'fs';
import path from 'path';

// Helper functions remain unchanged...

const main = async () => {
    console.log('\n=== Bandit Breakout ===');
    try {
        // Create saves directory if needed
        const SAVE_DIR = './saves';
        if (!fs.existsSync(SAVE_DIR)) {
            fs.mkdirSync(SAVE_DIR);
        }

        // Main menu with enhanced error handling
        const menuChoice = await prompts({
            type: 'select',
            name: 'action',
            message: 'Main Menu',
            choices: [
                { title: 'New Game', value: 'new' },
                { title: 'Load Game', value: 'load' },
                { title: 'Exit', value: 'exit' }
            ]
        }).catch(err => {
            console.error('Menu error:', err);
            process.exit(1);
        });

        if (!menuChoice || menuChoice.action === 'exit') {
            console.log('Goodbye!');
            return;
        }

        const game = new Game();
        let sessionId = `session-${Date.now()}`;

        if (menuChoice.action === 'new') {
            // Initialize new game
            const numPlayers = (await prompts({
                type: 'number',
                name: 'count',
                message: 'Number of players (1-4):',
                min: 1,
                max: 4
            })).count;

            game.startGame(numPlayers, sessionId);
            console.log(`New game started with ${numPlayers} players`);
        } else if (menuChoice.action === 'load') {
            // Load existing game
            const saveFiles = fs.readdirSync('./saves')
                .filter(f => f.endsWith('.json'))
                .map(f => ({ title: f, value: f }));

            if (saveFiles.length === 0) {
                console.log('No saved games found');
                return;
            }

            const saveChoice = await prompts({
                type: 'select',
                name: 'file',
                message: 'Select save file:',
                choices: saveFiles
            });

            const saveData = JSON.parse(fs.readFileSync(`./saves/${saveChoice.file}`, 'utf8'));
            game.loadFromSave(saveData);
            sessionId = saveData.sessionId;
            console.log(`Game loaded from ${saveChoice.file}`);
        }

        // Save game function
        const saveGame = () => {
            const savePath = `./saves/${sessionId}.json`;
            fs.writeFileSync(savePath, JSON.stringify(game.getSaveData(), null, 2));
            console.log(`Game saved to ${savePath}`);
        };

        // Main game loop
        while (true) {
            for (const player of game.players) {
                if (!player.isAlive) continue;

                console.log(`\n=== Player ${player.id}'s Turn ===`);
                console.log(`Position: ${game.map.findPlayer(player.id)}`);
                console.log(`Gold: ${player.getGold()}`);
                console.log(`Effects: ${player.status.getEffects().map(e => e.name).join(', ') || 'None'}`);

                const action = await prompts({
                    type: 'select',
                    name: 'choice',
                    message: 'Choose action:',
                    choices: [
                        { title: 'Roll Dice & Move', value: 'move' },
                        { title: 'Use Item', value: 'item' },
                        { title: 'Save Game', value: 'save' },
                        { title: 'End Game', value: 'exit' }
                    ]
                });

                if (action.choice === 'exit') {
                    return;
                } else if (action.choice === 'save') {
                    saveGame();
                    continue;
                } else if (action.choice === 'item') {
                    // Item usage logic would go here
                    console.log('Item usage not yet implemented');
                    continue;
                }

                // Handle movement
                await game.movePlayerByDice(player.id);
                
                // Process end of turn effects
                player.status.decrementEffectDurations();
            }
        }

    } catch (err) {
        console.error('Game error:', err);
        throw err;
    }
};

// Startup with robust error handling
console.log('Starting Bandit Breakout...');
(async () => {
    try {
        await main();
    } catch (err) {
        console.error('\nFATAL ERROR:', err);
        process.exit(1);
    }
})().catch(err => {
    console.error('\nUNHANDLED ERROR:', err);
    process.exit(1);
});
