import { defineConfig } from "vite";

export default defineConfig({
  root: "phaser-game", // Set the root directory to phaser-game
  server: {
    port: 30006, // Ensure the port matches your npm script
  },
});
