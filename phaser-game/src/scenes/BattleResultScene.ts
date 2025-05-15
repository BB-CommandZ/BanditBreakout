import Phaser from 'phaser';

export default class BattleResultScene extends Phaser.Scene {
    constructor() {
        super('BattleResultScene');
    }

    preload() {
        // Set base URL and path for assets to load from the backend
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'; // Backend server URL
        this.load.setBaseURL(serverUrl);
        this.load.setPath('assets/'); // Path to assets served by the backend

        // Load assets
        this.load.image('background', 'background.png');
        this.load.svg('defeat', 'defeat.svg');
        this.load.svg('victory', 'victory.svg');
    }

    create(data: { outcome: 'win' | 'lose' }) {
        // Display background
        const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'background');
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Display victory or defeat image based on outcome
        if (data.outcome === 'win') {
            this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'victory');
        } else {
            this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'defeat');
        }

        // Add input handling to return to the game
        this.input.once('pointerdown', () => {
            this.scene.start('MainScreen'); // Assuming 'MainScreen' is your main game scene
        });
    }
}
