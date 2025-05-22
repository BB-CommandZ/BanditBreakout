import Game from "./Game";
import Player from "./Player";

export default class Battle {
  private player: Player;
  private game: Game;
  private opponent: Player;
  private playerHP: number;
  private opponentHP: number;
  private amountBuff: { buffType: string; amount: number };

  constructor(player: Player, opponent: Player) {
    this.player = player;
    this.game = this.player.game;
    this.opponent = opponent;
    this.playerHP = 10; // Starting HP for battle
    this.opponentHP = 10; // Starting HP for battle
    this.amountBuff = { buffType: "none", amount: 0 };
  }

  private rollDice(): number {
    return Math.floor(Math.random() * 6) + 1; // Roll a dice (1-6)
  }

  public processTurn(): {
    result: string;
    playerHP: number;
    opponentHP: number;
    winner: Player | null;
    turn: number;
  } {
    this.checkBattleEffects(this.player);
    this.checkBattleEffects(this.opponent);

    let turn = 0;
    let result = "";
    let winner: Player | null = null;

    // Continue battle until one player is defeated
    while (this.playerHP > 0 && this.opponentHP > 0) {
      turn++;
      const playerRoll = this.rollDice();
      const opponentRoll = this.rollDice();

      // Damage is equal to the dice roll (number of bullets shot)
      this.opponentHP -= playerRoll;
      this.playerHP -= opponentRoll;

      result += `Turn ${turn}: Player ${this.player.id} rolled ${playerRoll}, dealing ${playerRoll} damage. `;
      result += `Player ${this.opponent.id} rolled ${opponentRoll}, dealing ${opponentRoll} damage. `;
      result += `Player ${this.player.id} HP: ${this.playerHP}, Player ${this.opponent.id} HP: ${this.opponentHP}.\n`;

      if (this.playerHP <= 0 && this.opponentHP <= 0) {
        result += "It's a draw! Both players are knocked out.";
        break;
      } else if (this.playerHP <= 0) {
        result += `Player ${this.opponent.id} wins after ${turn} turns!`;
        winner = this.opponent;
        this.applyLossConsequences(this.player, this.opponent);
        break;
      } else if (this.opponentHP <= 0) {
        result += `Player ${this.player.id} wins after ${turn} turns!`;
        winner = this.player;
        this.applyLossConsequences(this.opponent, this.player);
        break;
      }
    }

    return {
      result,
      playerHP: this.playerHP,
      opponentHP: this.opponentHP,
      winner,
      turn,
    };
  }

  private applyLossConsequences(loser: Player, winner: Player): void {
    // Move loser back 2 tiles
    loser.move.back(2);
    // Transfer 3 gold from loser to winner, or all remaining gold if less than 3
    const goldToTransfer = Math.min(3, loser.getGold());
    loser.gold(`-${goldToTransfer}`);
    winner.gold(`+${goldToTransfer}`);
  }

  public processEndOfRoundBattle(): {
    result: string;
    winner: Player | null;
    itemTransferred?: number;
    goldTransferred?: number;
    turn: number;
  } {
    const turnResult = this.processTurn();
    let result = turnResult.result;
    let winner = turnResult.winner;
    let itemTransferred: number | undefined;
    let goldTransferred: number | undefined;
    let turn = turnResult.turn;

    if (winner) {
      const loser = winner.id === this.player.id ? this.opponent : this.player;
      // Winner takes a random item or 3 gold from loser
      if (loser.inventory.items.length > 0 && Math.random() < 0.5) {
        const randomItemIndex = Math.floor(
          Math.random() * loser.inventory.items.length
        );
        const item = loser.inventory.items[randomItemIndex];
        itemTransferred = item.id;
        loser.inventory.removeItem(item);
        winner.inventory.addItem(item);
        result += ` Winner Player ${winner.id} took item ${item.name} from loser.`;
      } else {
        const goldToTransfer = Math.min(3, loser.getGold());
        goldTransferred = goldToTransfer;
        loser.gold(`-${goldToTransfer}`);
        winner.gold(`+${goldToTransfer}`);
        result += ` Winner Player ${winner.id} took ${goldToTransfer} gold from loser.`;
      }
    }

    return { result, winner, itemTransferred, goldTransferred, turn };
  }

  private getActionAmount(action: string): number {
    let baseAmount = this.rollDice();
    if (this.amountBuff.buffType === action) {
      baseAmount += this.amountBuff.amount;
    }
    return baseAmount;
  }

  public checkBattleEffects(player: Player): void {
    const hasEffect = player.status.hasEffect;
    if (hasEffect) {
      const buffs = player.status.effects;
      if (buffs.includes("chicken-leg")) {
        player.health("+2");
        player.effectRemove("chicken-leg");
      }
      if (buffs.includes("cactus")) {
        player.health("-1");
        player.effectRemove("cactus");
      }
      if (buffs.includes("cowboy-boots")) {
        player.health("+6");
        this.amountBuff = { buffType: "attack", amount: -1 };
        this.amountBuff = { buffType: "defense", amount: -1 };
        player.effectRemove("cowboy-boots");
      }
      if (buffs.includes("revolver")) {
        this.amountBuff = { buffType: "attack", amount: 1 };
        player.effectRemove("revolver");
      }
      if (buffs.includes("sunscreen")) {
        this.amountBuff = { buffType: "defense", amount: 1 };
        player.effectRemove("sunscreen");
      }
    }
  }
}
