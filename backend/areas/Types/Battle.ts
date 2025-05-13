import Game from "./Game";
import Player from "./Player";

export default class Battle {
  private player: Player;
  private game: Game;
  private opponent: Player;
  private amountBuff: { buffType: string; amount: number };

  constructor(player: Player, opponent: Player) {
    this.player = player;
    this.game = this.player.game;
    this.opponent = opponent;
    this.amountBuff = { buffType: "none", amount: 0 };
  }

  attack(opponent: Player) {
    let attackAmount = this.getActionAmount("attack");
    // check the opponentId

    opponent.health(`-${attackAmount}`);
  }

  defend(self: Player) {
    let defenseAmount = this.getActionAmount("defense");

    self.health(`+${defenseAmount}`);
  }

  resolveMove(player: Player) {}

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
      let buffs = player.status.effects;
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
