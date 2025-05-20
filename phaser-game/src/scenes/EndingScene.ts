import Phaser from "phaser";

export class EndingScene extends Phaser.Scene {
    private characterEndingVideo!: Phaser.GameObjects.Video;
    private selectedCharacterId: number = 0;

    constructor() {
        super("EndingScene");
    }

    init(data: { characterId: number }) {
        this.selectedCharacterId = data.characterId;
        console.log(`EndingScene initialized with characterId: ${this.selectedCharacterId}`);
    }

    preload() {
        // Define the mapping of character IDs to video filenames
        const characterVideoMap: { [key: number]: string } = {
            1:  'catend.mp4', // Buckshot
            2:  'snakeend.mp4', // Serpy
            3:  'capyend.mp4', // Grit
            4:  'crowendf.mp4', // Solstice
            5:  'dogend.mp4', // Scout 
        };

        const videoFilename = characterVideoMap[this.selectedCharacterId];

        if (videoFilename) {
            const videoKey = `characterEnding_${this.selectedCharacterId}`;
            const videoPath = `assets_for_character_endings/${videoFilename}`;

            // Load the specific ending video based on the selected character ID
            this.load.video(videoKey, videoPath, true);
            console.log(`Attempting to load ending video for character ${this.selectedCharacterId}: ${videoPath}`);

            // Add listeners for load completion and errors
            this.load.on(`filecomplete-video-${videoKey}`, () => {
                console.log(`Successfully loaded ending video: ${videoPath}`);
            });

            this.load.on(`loaderror`, (file: any) => {
                if (file.key === videoKey) {
                    console.error(`Error loading ending video: ${videoPath}`, file);
                }
            });

        } else {
            console.error(`No ending video filename found for character ID: ${this.selectedCharacterId}`);
        }
    }

    create() {
        // Get the loaded video
        const videoKey = `characterEnding_${this.selectedCharacterId}`;
        if (this.cache.video.exists(videoKey)) {
            console.log(`Video asset found in cache: ${videoKey}`);
            this.characterEndingVideo = this.add.video(this.cameras.main.centerX, this.cameras.main.centerY, videoKey);

            this.characterEndingVideo.setVisible(true); // Ensure visibility

            console.log(`Attempting to play video: ${videoKey}`);
            this.characterEndingVideo.play(false);
            console.log(`Video play() called. Video state: ${this.characterEndingVideo.video ? this.characterEndingVideo.video.readyState : 'N/A'}`);


            // Add event listeners for video playback
            this.characterEndingVideo.on('play', () => {
                console.log('Video started playing.');
            });

            // Scale the video to fit the screen while maintaining aspect ratio after metadata is loaded
            if (this.characterEndingVideo.video) {
                this.characterEndingVideo.video.addEventListener('loadedmetadata', () => {
                    console.log('Video metadata loaded. Scaling video.');
                    if (this.characterEndingVideo.video) { // Additional check
                        const videoAspectRatio = this.characterEndingVideo.video.videoWidth / this.characterEndingVideo.video.videoHeight;
                        const screenAspectRatio = this.cameras.main.width / this.cameras.main.height;

                    let displayWidth = this.cameras.main.width;
                    let displayHeight = this.cameras.main.height;

                    if (videoAspectRatio > screenAspectRatio) {
                        // Video is wider than screen, scale based on width
                        displayHeight = this.cameras.main.width / videoAspectRatio;
                    } else {
                        // Video is taller than screen, scale based on height
                        displayWidth = this.cameras.main.height * videoAspectRatio;
                    }

                    this.characterEndingVideo.setDisplaySize(displayWidth / 6, displayHeight / 6);
                    console.log(`Video scaled to: ${displayWidth / 6}x${displayHeight / 6}`);
                    } // Closing brace for inner if
                }); // Closing brace for event listener
            } else {
                console.warn("Video element not available for scaling.");
            }

            // Add event listeners for video playback state
            this.characterEndingVideo.on('playing', () => {
                console.log('Video is playing.');
            });

            this.characterEndingVideo.on('paused', () => {
                console.log('Video is paused.');
            });

            this.characterEndingVideo.on('ended', () => {
                console.log('Video ended.');
            });


            // Add an event listener to return to a scene after the video finishes
            this.characterEndingVideo.on('complete', () => {
                console.log('Ending video finished, returning to MapScene');
                this.scene.start('MapScene'); // Return to MapScene
            });

            // Allow skipping the video on pointer down
            this.input.once('pointerdown', () => {
                console.log('Pointer down detected, skipping ending video and returning to MapScene');
                this.characterEndingVideo.stop();
                this.scene.start('MapScene'); // Return to MapScene
            });

        } else {
            console.error(`Ending video asset not found in cache for key: ${videoKey}`);
            // If video not found, immediately transition back
            this.scene.start('MapScene'); // Return to MapScene
        }
    }
}
