import Game from "./Game";
import Player from "./Player";

export default class Battle {
  private player: Player;
  private game: Game;
  private opponent: Player;
  private playerAction!: string;
  private opponentAction!: string;
  private amountBuff: { buffType: string; amount: number };

  constructor(player: Player, opponent: Player) {
    this.player = player;
    this.game = this.player.game;
    this.opponent = opponent;
    this.amountBuff = { buffType: "none", amount: 0 };
  }

  attack(opponent: Player) {
    let attackAmount = this.getActionAmount("attack");

    opponent.health(`-${attackAmount}`);
  }

  defend(self: Player) {
    let defenseAmount = this.getActionAmount("defense");

    self.health(`+${defenseAmount}`);
  }

  public processTurn(playerAction: string, opponentAction: string): string {
    this.checkBattleEffects(this.player);
    this.checkBattleEffects(this.opponent);

    if (playerAction === "attack" && opponentAction === "defense") {
      const attackAmount = this.getActionAmount("attack");
      const defenseAmount = this.getActionAmount("defense");
      const damage = Math.max(0, attackAmount - defenseAmount);
      this.opponent.health(`-${damage}`);
      return `Player attacked, opponent defended. Opponent lost ${damage} health.`;
    } else if (playerAction === "attack" && opponentAction === "attack") {
      const playerDamage = this.getActionAmount("attack");
      const opponentDamage = this.getActionAmount("attack");
      this.player.health(`-${opponentDamage}`);
      this.opponent.health(`-${playerDamage}`);
      return `Both players attacked. Player lost ${opponentDamage} health, opponent lost ${playerDamage} health.`;
    } else if (playerAction === "defense" && opponentAction === "defense") {
      return `Both players defended. No damage dealt.`;
    }
    return "Invalid actions.";
  }

  private getActionAmount(action: string) {
    // get num 1-6
    let baseAmount = Math.floor(Math.random() * 6) + 1;
    // check if buff
    if (this.amountBuff.buffType === action) {
      baseAmount += this.amountBuff.amount;
    }
    return baseAmount;
  }

  public checkBattleEffects(player: Player) {
    const hasEffect = player.status.hasEffect;
    if (hasEffect) {
      const buffs = player.status.effects;
      //check effect
      //if its health effect
      // add health
      // else
      // adjust amount using amountBuff

      // if buffs.contains('cactus") {}
      // if buffs.contains('revolver") {}
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
