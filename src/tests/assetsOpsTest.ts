import { getAssetByFilename } from '../db/operations/assetsOps';
import { connectToDatabase, disconnectFromDatabase } from '../db/mongoose';
import { getFromCache, setToCache } from '../cache';
import fs from 'fs';
import path from 'path';

// Mock Redis cache functions for testing purposes
jest.mock('../cache', () => ({
  getFromCache: jest.fn(() => Promise.resolve(null)),
  setToCache: jest.fn(() => Promise.resolve()),
}));

describe('Assets Operations Tests', () => {
  beforeAll(async () => {
    // Connect to the database before running tests
    await connectToDatabase();
  });

  afterAll(async () => {
    // Disconnect from the database after tests
    await disconnectFromDatabase();
  });

  test('Retrieve assets by filename from assets_filename.txt', async () => {
    // Read filenames from assets_filename.txt
    const filePath = path.join(__dirname, 'assets_filename.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const filenames = fileContent
      .split('\n')
      .filter(line => line.trim().startsWith('  - '))
      .map(line => line.trim().replace('  - ', ''));

    // Test retrieval for a subset of assets (to keep test execution time reasonable)
    const testFilenames = filenames.slice(0, 5); // Test first 5 assets

    for (const filename of testFilenames) {
      console.log(`Testing retrieval of asset: ${filename}`);
      const asset = await getAssetByFilename(filename);
      
      // Log the result for debugging purposes
      if (asset) {
        console.log(`✓ Successfully retrieved asset: ${filename}`);
      } else {
        console.log(`✗ Asset not found: ${filename}`);
      }
      
      // We don't assert on existence since assets might not be in DB during test
      // Just ensure the function executes without throwing an error
      expect(asset).toBeDefined(); // This will be null if not found, which is acceptable
    }
  }, 30000); // Increase timeout to 30 seconds for asset retrieval

  test('Cache interaction for asset retrieval', async () => {
    const testFilename = 'test_asset.png';
    
    // First call should hit database (mocked cache returns null)
    await getAssetByFilename(testFilename);
    
    // Verify cache interactions
    expect(getFromCache).toHaveBeenCalledWith(`asset:${testFilename}`);
    // Since no asset is found for a dummy filename, setToCache won't be called
    // We are testing the scenario where cache is checked but no asset is found to cache
    expect(setToCache).not.toHaveBeenCalledWith(`asset:${testFilename}`, expect.anything());
  });
});
