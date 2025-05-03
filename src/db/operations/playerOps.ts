import { PlayerModel } from '../models/PlayerModel';

export async function createPlayer(game_id: string, player_id: number) {
    try {
        const newPlayer = new PlayerModel({
            game_id,
            player_id
        });
        await newPlayer.save();
        return newPlayer;
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
}

export async function getPlayer(player_id: number) {
    try {
        const player = await PlayerModel.findOne({ player_id });
        return player;
    } catch (error) {
        console.error('Error getting player:', error);
        throw error;
    }
}

export async function updatePlayerPosition(player_id: number, position: number) {
    try {
        const player = await PlayerModel.findOneAndUpdate(
            { player_id },
            { position },
            { new: true }
        );
        return player;
    } catch (error) {
        console.error('Error updating player position:', error);
        throw error;
    }
}

export async function updatePlayerStatus(player_id: number, status: { gold?: number, health?: number, effects?: string[] }) {
    try {
        const update: any = { status };
        const player = await PlayerModel.findOneAndUpdate(
            { player_id },
            update,
            { new: true }
        );
        return player;
    } catch (error) {
        console.error('Error updating player status:', error);
        throw error;
    }
}

export async function addItemToInventory(player_id: number, item: any) {
    try {
        const player = await PlayerModel.findOneAndUpdate(
            { player_id },
            { $push: { inventory: item } },
            { new: true }
        );
        return player;
    } catch (error) {
        console.error('Error adding item to inventory:', error);
        throw error;
    }
}
