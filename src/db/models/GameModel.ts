import { Schema, model, Document } from 'mongoose';

interface IGame extends Document {
    game_id: string;
    name: string;
    players: number[];
    map: {
        tiles: Array<{
            position: number;
            hasPlayerOnTile: boolean;
            playersOnTile: number[];
            hasEvent: boolean;
            event: {
                name: string;
                type: number;
                description: string;
                effect: string;
            };
        }>;
    };
    createdAt: Date;
    updatedAt: Date;
}

const GameSchema = new Schema<IGame>({
    game_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    players: { type: [Number], default: [] },
    map: {
        tiles: [{
            position: { type: Number, required: true },
            hasPlayerOnTile: { type: Boolean, default: false },
            playersOnTile: { type: [Number], default: [] },
            hasEvent: { type: Boolean, default: false },
            event: {
                name: { type: String, default: 'Nothing' },
                type: { type: Number, default: 0 },
                description: { type: String, default: 'Nothing happens here' },
                effect: { type: String, default: 'No effect' }
            }
        }]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
GameSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

export const GameModel = model<IGame>('Game', GameSchema);
