# Bandit Breakout

Bandit Breakout is a terminal-based board game where players move around a map, encounter events, collect items, and battle each other.

## How to Run

To get the game running on your local machine:

1.  **Clone the repository** (if you haven't already).
2.  **Navigate to the project directory** in your terminal.
3.  **Install dependencies** by running:
    ```bash
    npm install
    ```
4.  **Start the game** by running:
    ```bash
    npm start
    ```
    or
    ```bash
    npm run cli-game
    ```

## Features and Progress

-   Core player movement is implemented, allowing players to move forward and backward on the map based on dice rolls.
-   Decision events are integrated, allowing players to make choices on specific tiles that can affect their path.
-   Movement logic has been refined to correctly handle continuing movement after decision points and ensure events and battles trigger only on the final landed tile of a movement sequence.
-   Various tile events are implemented, including Safe tiles (gain gold), Item tiles (find items), Shop tiles (buy items), Slots tiles (gamble gold), Mining tiles (mine gold), Decision tiles (make choices), Cursed Coffin traps (stun players), and Boss Battle tiles (placeholder).
-   Basic item usage is implemented for several items.
-   Player status effects (like stun and battle buffs) are tracked.
-   Game saving and loading functionality is available.

This project is currently under active development.
