import Game from "./areas/Types/Game";
import fs from "fs";

async function testSaveLoad() {
    // Create and initialize game
    const game = new Game();
    game.startGame(2, "test-session");
    
    // Modify some game state
    game.players[0].setGold(50);
    game.players[1].setGold(25);
    game.players[0].effectAdd("test_effect", 3);
    
    // Save game
    const saveData = game.getSaveData();
    fs.writeFileSync("./saves/test-save.json", JSON.stringify(saveData, null, 2));
    console.log("Game saved successfully");
    
    // Create new game and load
    const loadedGame = new Game();
    const loadedData = JSON.parse(fs.readFileSync("./saves/test-save.json", "utf8"));
    loadedGame.loadFromSave(loadedData);
    
    // Verify loaded state
    console.log("Verifying loaded game:");
    console.log("Session ID:", loadedGame.sessionId);
    console.log("Player 1 gold:", loadedGame.players[0].getGold());
    console.log("Player 2 gold:", loadedGame.players[1].getGold());
    console.log("Player 1 effects:", loadedGame.players[0].status.getEffects());
    
    // Verify map state
    const player1Pos = loadedGame.map.findPlayer(1);
    const player2Pos = loadedGame.map.findPlayer(2);
    console.log("Player 1 position:", player1Pos);
    console.log("Player 2 position:", player2Pos);
}

testSaveLoad().catch(console.error);
