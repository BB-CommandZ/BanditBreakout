import Phaser from 'phaser';
import { SocketService } from '../services/SocketService'; // Changed to named import

export default class ShopScene extends Phaser.Scene {
    private socketService: SocketService;
    private playerGoldText: Phaser.GameObjects.Text | undefined;
    private itemContainer: Phaser.GameObjects.Container | undefined; // Moved to class level

    constructor() {
        super('ShopScene');
        this.socketService = SocketService.getInstance();
    }

    preload() {
        // Load shop assets
        this.load.image('shopBackground', 'tempassets_shop/background.png');
        this.load.image('shipkeeper', 'tempassets_shop/shipkeeper.png');
        this.load.image('backButton', 'tempassets_shop/backbutton.png');
        this.load.image('coinIcon', 'tempassets_shop/coin icon.png');
        this.load.svg('settingsButton', 'tempassets_shop/settingbutton.svg');
        this.load.image('itemBoard', 'tempassets_shop/toplaceitemon.png');
        // Load item images (assuming filenames match item names or IDs)
        this.load.svg('lassoItem', 'tempassets_shop/lasso zoom.svg');
        this.load.svg('shovelItem', 'tempassets_shop/shovel zoom.svg');
        this.load.svg('vestItem', 'tempassets_shop/vest zoom.svg');
        this.load.svg('poisonCrossbowItem', 'tempassets_shop/crossbow zoom.svg');
        this.load.svg('mirageTeleporterItem', 'tempassets_shop/teleporter zoom.svg');
        this.load.svg('cursedCoffinItem', 'tempassets_shop/Coffin zoom.svg');
        this.load.svg('riggedDiceItem', 'tempassets_shop/dice zoom.svg');
        this.load.svg('vsItem', 'tempassets_shop/vs zoom.svg');
        this.load.svg('tumbleweedItem', 'tempassets_shop/tumbleweed zoom.svg');
        this.load.svg('magicCarpetItem', 'tempassets_shop/carpet zoom.svg');
        this.load.svg('windStaffItem', 'tempassets_shop/staff zoom.svg');
        this.load.svg('buyButtonWithPrice', 'tempassets_shop/buybuttonwithprice.svg'); // Assuming this is a single asset for the button with price text
        // Assuming slider assets are needed even without a full slider implementation for now
        this.load.svg('shopSlider', 'tempassets_shop/shopslider.svg');
        this.load.svg('shopSliderButton', 'tempassets_shop/shopsliderbutton.svg');
    }

    create(data: { shopData?: { items: { id: number, name: string, price: number }[], playerGold: number } }) {
        // Add background
        const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'shopBackground');
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Add shipkeeper
        const shipkeeper = this.add.image(this.cameras.main.centerX, this.cameras.main.height * 1.0, 'shipkeeper').setScale(1.75);
        shipkeeper.setOrigin(0.5, 1); // Align bottom of image with position

        // Add "Wim's Shop" text (placeholder position)
        this.add.text(this.cameras.main.width * 0.8, this.cameras.main.height * 0.1, "Wim's Shop", {
            fontSize: '32px',
            color: '#fff'
        }).setOrigin(0.5);

        // Add back button (placeholder position)
        const backButton = this.add.image(this.cameras.main.width * 0.1, this.cameras.main.height * 0.1, 'backButton');
        backButton.setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.stop('ShopScene');
            this.scene.resume('MapScene'); // Assuming MapScene is the scene to return to
        });

        // Add text to the back button
        this.add.text(backButton.x, backButton.y, 'back', { fontSize: '24px', color: '#fff' }).setOrigin(0.5);

        // Add coin counter (placeholder position)
        this.add.image(this.cameras.main.width * 0.1, this.cameras.main.height * 0.45, 'coinIcon').setScale(0.025); // Adjust scale as needed
        this.playerGoldText = this.add.text(this.cameras.main.width * 0.15, this.cameras.main.centerY, '0', {
             fontSize: '24px',
             color: '#fff'
        }).setOrigin(0, 0.5);


        // Add settings button (placeholder position)
         const settingsButton = this.add.image(this.cameras.main.width * 0.9, this.cameras.main.height * 0.15, 'settingsButton');
         settingsButton.setInteractive();
         settingsButton.on('pointerdown', () => {
             console.log("Settings button clicked");
             // TODO: Implement settings functionality
         });


        // Add item board (placeholder position)
        const itemBoard = this.add.image(this.cameras.main.centerX, this.cameras.main.height * 0.9, 'itemBoard');
        itemBoard.setOrigin(0.5, 1); // Align bottom of image with position
        itemBoard.setDisplaySize(this.cameras.main.width * 0.8, this.cameras.main.height * 0.4); // Adjust size as needed
        // itemBoard.setVisible(false); // Removed temporary hide

        // Create a container for shop items
        this.itemContainer = this.add.container(this.cameras.main.centerX, this.cameras.main.height * 0.7); // Position the container
        this.itemContainer.setDepth(100); // Set a high depth to ensure it renders on top

        console.log("ShopScene create method reached. Data parameter:", data);

        // Set up Socket.IO listeners
        this.socketService.on('shopOpen', this.handleShopOpen.bind(this));
        this.socketService.on('itemPurchased', this.handleItemPurchased.bind(this));
        this.socketService.on('shopError', this.handleShopError.bind(this));

        // If shop data was passed during scene start, handle it immediately
        if (data.shopData) {
             console.log("shopData found in data parameter. Calling handleShopOpen.");
             this.handleShopOpen(data.shopData);
        }
    }

    update() {
        // Game loop logic if needed
    }

    handleShopOpen(data: { items: { id: number, name: string, price: number }[], playerGold: number }) {
        console.log("Entered handleShopOpen");
        console.log("Shop opened with data:", data);
        // Update player gold display
        console.log("Accessing data.playerGold:", data.playerGold);
        console.log("Checking this.playerGoldText:", this.playerGoldText);
        if (this.playerGoldText) {
            this.playerGoldText.setText(data.playerGold.toString());
        }

        // Clear previous items (if any) - assuming items are added to a container or group
        // For simplicity now, we'll just add them directly and assume they don't persist between shop visits
        // A more robust solution would use a container and clear it here.

        // Display items for sale
        console.log("About to start items forEach loop. data.items:", data.items);
        const itemBoardX = this.cameras.main.centerX;
        const itemBoardY = this.cameras.main.height * 0.9; // Bottom of the screen
        const itemSpacing = 150; // Horizontal spacing between items
        const startX = itemBoardX - (data.items.length - 1) * itemSpacing / 2; // Center the items

        data.items.forEach((item, index) => {
            console.log("Entered forEach callback for item:", item);
            console.log("Processing item:", item);
            // Assuming item asset keys are like 'itemIdItem' (e.g., '2Item' for Vest)
            // Need a mapping from item ID to asset key
            const itemAssetKeyMap: { [key: number]: string } = {
                0: 'lassoItem',
                1: 'shovelItem',
                2: 'vestItem',
                3: 'poisonCrossbowItem',
                4: 'mirageTeleporterItem',
                5: 'cursedCoffinItem',
                6: 'riggedDiceItem',
                7: 'vsItem',
                8: 'tumbleweedItem',
                9: 'magicCarpetItem',
                10: 'windStaffItem',
            };
            // Temporarily use colored rectangles for debugging
            if (this.itemContainer) {
                const itemRect = this.add.graphics();
                itemRect.fillStyle(0xff0000, 1); // Red color
                itemRect.fillRect(0, 0, 50, 50); // Rectangle size
                const itemSprite = this.itemContainer.add(itemRect);
                itemSprite.setPosition(startX + index * itemSpacing - this.itemContainer.x, -40); // Position above the board bottom
                console.log("Item rectangle created:", itemSprite);

                const buyButtonRect = this.add.graphics();
                buyButtonRect.fillStyle(0x00ff00, 1); // Green color
                buyButtonRect.fillRect(0, 0, 80, 40); // Rectangle size
                const buyButton = this.itemContainer.add(buyButtonRect);
                buyButton.setPosition(startX + index * itemSpacing - this.itemContainer.x, 40); // Position on the board
                console.log("Buy button rectangle created:", buyButton);
                buyButton.setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 40), Phaser.Geom.Rectangle.Contains); // Set interactive area
                buyButton.setData('itemId', item.id); // Store item ID on the button

                // Add price text on the button (placeholder position)
                const priceText = this.add.text(buyButton.x, buyButton.y, item.price.toString(), {
                    fontSize: '18px',
                    color: '#000' // Adjust color as needed
                }).setOrigin(0.5);
                this.itemContainer.add(priceText);


                buyButton.on('pointerdown', () => {
                    this.buyItem(buyButton.getData('itemId'));
                });
            } else {
                console.warn("itemContainer is undefined");
            }
        });
    }

    handleItemPurchased(data: { itemId: number, itemName: string, remainingGold: number, inventory: { id: number, name: string }[] }) {
        console.log("Item purchased:", data);
        // Update player gold display
         if (this.playerGoldText) {
             this.playerGoldText.setText(data.remainingGold.toString());
         }
        // TODO: Update player inventory display if needed (might require a separate inventory UI element)
        // Provide visual feedback to the player (confirmation message)
        const confirmationText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Purchased ${data.itemName}!`, {
            fontSize: '24px',
            color: '#0f0', // Green color for success
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        this.tweens.add({
            targets: confirmationText,
            alpha: 0,
            duration: 2000, // Display for 2 seconds
            ease: 'Power2',
            onComplete: () => {
                confirmationText.destroy();
            }
        });
    }

    handleShopError(data: { message: string }) {
        console.error("Shop error:", data.message);
        // Display error message to the player (temporary text overlay)
        const errorText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Error: ${data.message}`, {
            fontSize: '24px',
            color: '#f00', // Red color for error
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
         this.tweens.add({
            targets: errorText,
            alpha: 0,
            duration: 3000, // Display for 3 seconds
            ease: 'Power2',
            onComplete: () => {
                errorText.destroy();
            }
        });
    }

    // Method to buy an item, called by buy button click handlers
    buyItem(itemId: number) {
        const gameId = this.socketService.getGameId();
        const playerId = this.socketService.getPlayerId();

        if (gameId && playerId) {
             this.socketService.emit('buyShopItem', gameId, playerId, itemId);
        } else {
            console.error("Cannot buy item: gameId or playerId is missing.");
        }
    }
}
