import { Schema, model, Document } from 'mongoose';

interface IPlayer extends Document {
    game_id: string;
    player_id: number;
    character_id: number;
    isAlive: boolean;
    status: {
        gold: number;
        health: number;
        hasEffect: boolean;
        effects: string[];
    };
    inventory: Array<{
        id: number;
        name: string;
        description: string;
        effect: string;
        isBattleItem: boolean;
        isUsable: boolean;
    }>;
    position: number;
}

const PlayerSchema = new Schema<IPlayer>({
    game_id: { type: String, required: true },
    player_id: { type: Number, required: true, unique: true },
    character_id: { type: Number, default: 0 },
    isAlive: { type: Boolean, default: true },
    status: {
        gold: { type: Number, default: 0 },
        health: { type: Number, default: 10 },
        hasEffect: { type: Boolean, default: false },
        effects: { type: [String], default: [] }
    },
    inventory: [{
        id: { type: Number, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        effect: { type: String, required: true },
        isBattleItem: { type: Boolean, default: false },
        isUsable: { type: Boolean, default: false }
    }],
    position: { type: Number, default: 0 }
});

export const PlayerModel = model<IPlayer>('Player', PlayerSchema);
