
import Game from './Game';
import Player from './Player';

export default class Battle {
    private player: Player;
    private game: Game;
    private opponent: Player;
    private amountBuff: {buffType: string, amount: number};
    
    constructor(player: Player, opponent: Player) {
        this.player = player;
        this.game = this.player.game;
        this.opponent = opponent;
        this.amountBuff = {buffType: "none", amount: 0}
    }
    
    attack(opponent: Player) {
        let attackAmount = this.getActionAmount("attack")
        
    }
    
    defend(self: Player) {
        let defenseAmount = this.getActionAmount("defense")

    }

    resolveMove(player: Player) {
        
    }

    private getActionAmount(action: string) {
        // get num 1-6
        let baseAmount = Math.floor(Math.random() * 6) + 1;
        // check if buff
        if (this.amountBuff.buffType === action) {
        baseAmount += this.amountBuff.amount;
        }
        return baseAmount
    }

    public checkBattleEffects(player: Player) {
        const hasEffect = player.status.hasEffect
        if (hasEffect) {
            //check effect
            //if its health effect
            // add health
            // else
            // adjust amount using amountBuff

    
            } else {
                let buffs = player.status.effects
                // if buffs.contains('cactus") {}
                // if buffs.contains('revolver") {}
                // if buffs.contains('cdaeiomdnaewd") {}
                if (buffs.includes('revolver')) {
                    this.amountBuff = {buffType: "attack", amount: 1}
                }
            }
        }
    }
