import { getFromCache, setToCache } from '../../cache';
import { connectToDatabase } from '../mongoose';
import { MongoClient, GridFSBucket } from 'mongodb';

const DB_NAME = process.env.DB_NAME || 'game_assets';
const COLL_NAME = process.env.COLL_NAME || 'assets';
const GRIDFS_BUCKET = process.env.GRIDFS_BUCKET || 'assets_fs';

/**
 * Retrieves an asset by its filename from Redis cache or MongoDB storage.
 * @param filename - The name of the file to retrieve.
 * @returns The asset data if found, otherwise null.
 */
export async function getAssetByFilename(filename: string) {
    const cacheKey = `asset:${filename}`;
    let asset = await getFromCache(cacheKey);

    if (!asset) {
        try {
            await connectToDatabase();
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
            await client.connect();
            const db = client.db(DB_NAME);

            // Check in regular collection for small files
            asset = await db.collection(COLL_NAME).findOne({ filename });
            if (asset) {
                await setToCache(cacheKey, asset, 86400); // Cache for 1 day
                await client.close();
                return asset;
            }

            // Check in GridFS for large files
            const bucket = new GridFSBucket(db, { bucketName: GRIDFS_BUCKET });
            const cursor = bucket.find({ filename });
            asset = await cursor.next();
            if (asset) {
                await setToCache(cacheKey, asset);
                await client.close();
                return asset;
            }

            await client.close();
            return null;
        } catch (error) {
            console.error('Error getting asset:', error);
            throw error;
        }
    }
    return asset;
}
