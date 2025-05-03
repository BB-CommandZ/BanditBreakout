# Usage Guide for Test Scripts

This document provides instructions on how to use the test scripts located in the `tests` directory. These scripts are designed to help you test various components of the application, including database operations, cache functionality, and asset management.

## Prerequisites

Before running the test scripts, ensure you have the following set up:

- **Node.js and npm**: Make sure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).
- **MongoDB**: Ensure MongoDB is installed and running on your system. You can download it from [mongodb.com](https://www.mongodb.com/).
- **Redis**: Ensure Redis is installed and running on your system. You can download it from [redis.io](https://redis.io/).
- **MongoDB Tools**: For asset management scripts, ensure you have `mongosh` and `mongofiles` installed. These are part of MongoDB Database Tools.
- **Environment Variables**: Copy the `.env.example` file to `.env` and fill in the necessary environment variables like `MONGODB_URI`, `PORT`, etc.

## Running the Tests

### 1. Database Tests (`dbTest.ts`)

This script tests the connection to the MongoDB database and performs basic CRUD operations for players and games.

**Command:**
```bash
npx ts-node src/tests/dbTest.ts
```

**Expected Outcome:**
- The script will attempt to connect to the database.
- It will clean up any existing data.
- It will run a series of tests to create, read, update, and delete data for players and games.
- Console output will show the progress and results of each test (e.g., "✓ Player created", "✓ Game map updated").

### 2. Cache Tests (`cacheTest.ts`)

This script tests the Redis cache functionality, including setting, getting, expiring, and invalidating data from the cache, as well as integration with game operations.

**Command:**
```bash
npx ts-node src/tests/cacheTest.ts
```

**Expected Outcome:**
- The script will run tests to set and get data from the cache.
- It will test cache expiration and invalidation.
- It will test integration with game data caching.
- Console output will show the progress and results of each test (e.g., "✓ Test 1 passed: Successfully set and retrieved data from cache").

### 3. Asset Management Scripts

These scripts help in managing test assets by uploading them to MongoDB (either as documents for small files or via GridFS for large files) and resetting them when needed.

#### 3.1. Uploading Assets (`assets.sh` / `assets.ps1`)

These scripts upload assets from a specified directory to MongoDB. Files smaller than a threshold (default 16 MiB) are stored as documents, while larger files are stored in GridFS.

- **Unix/Linux/MacOS (`assets.sh`)**:
  **Command:**
  ```bash
  ./src/tests/assets.sh <ASSETS_DIR> [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET] [THRESHOLD_MiB]
  ```
  **Example:**
  ```bash
  ./src/tests/assets.sh ./game/art mongodb://localhost:27017 game_assets assets assets_fs 16
  ```

- **Windows (PowerShell `assets.ps1`)**:
  **Command:**
  ```powershell
  .\src\tests\assets.ps1 -AssetsDir <DIR> [-MongoUri URI] [-Db DB] [-Coll COLL] [-Bucket BUCKET] [-ThresholdMiB MiB]
  ```
  **Example:**
  ```powershell
  .\src\tests\assets.ps1 -AssetsDir .\game\art -MongoUri mongodb://localhost:27017 -Db game_assets -Coll assets -Bucket assets_fs -ThresholdMiB 16
  ```

**Expected Outcome:**
- The script will scan the specified directory for files (e.g., PNG, SVG, MP3, WAV, MP4).
- It will exclude specific paths/files (e.g., "Voice lines", "BanditBreakout_hifi.mov").
- Small files are inserted as documents in the specified collection; large files are uploaded to GridFS.
- Console output will show whether each file is stored as a document or in GridFS (e.g., "📄 [Doc]" or "🎥 [GridFS]").

#### 3.2. Resetting Assets (`reset_assets.sh` / `reset_assets.ps1`)

These scripts delete assets previously uploaded by `assets.sh` or `assets.ps1` from MongoDB.

- **Unix/Linux/MacOS (`reset_assets.sh`)**:
  **Command:**
  ```bash
  ./src/tests/reset_assets.sh <ASSETS_DIR> [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET] [THRESHOLD_MiB]
  ```
  **Example:**
  ```bash
  ./src/tests/reset_assets.sh ./game/art mongodb://localhost:27017 game_assets assets assets_fs 16
  ```

- **Windows (PowerShell `reset_assets.ps1`)**:
  **Command:**
  ```powershell
  .\src\tests\reset_assets.ps1 -AssetsDir <DIR> [-MongoUri URI] [-Db DB] [-Coll COLL] [-Bucket BUCKET] [-ThresholdMiB MiB]
  ```
  **Example:**
  ```powershell
  .\src\tests\reset_assets.ps1 -AssetsDir .\game\art -MongoUri mongodb://localhost:27017 -Db game_assets -Coll assets -Bucket assets_fs -ThresholdMiB 16
  ```

**Expected Outcome:**
- The script will scan the same directory as used for uploading.
- It will delete corresponding documents (small files) from the collection and large files from GridFS.
- Console output will show deletion actions (e.g., "🗑️ [Doc] Deleting" or "🗑️ [GridFS] Deleting").

#### 3.3. Listing Assets (`list_assets.sh`)

This script lists all filenames stored in the MongoDB collection and GridFS bucket, displaying counts and filenames for both storage types.

- **Unix/Linux/MacOS (`list_assets.sh`)**:
  **Command:**
  ```bash
  ./src/tests/list_assets.sh [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET]
  ```
  **Example:**
  ```bash
  ./src/tests/list_assets.sh mongodb://localhost:27017 game_assets assets assets_fs
  ```

**Expected Outcome:**
- The script will connect to the specified MongoDB database.
- It will list all filenames stored in the specified collection for small files.
- It will list all filenames stored in the GridFS bucket for large files.
- Console output will show the database, collection, and bucket names, along with the total count of files in the collection and the filenames for both storage types (e.g., "Total files in collection: 347", "Filenames: - battle/victory.png").

### 4. Large File Scanner (`16M.sh`)

This script scans a directory for files larger than 16 MiB, useful for identifying assets that would be stored in GridFS by the asset management scripts.

**Command:**
```bash
./src/tests/16M.sh [DIRECTORY]
```
**Example:**
```bash
./src/tests/16M.sh ./game/art
```

**Expected Outcome:**
- The script will list all files larger than 16 MiB in the specified directory (default is current directory).
- Output will show file sizes and paths, sorted by size descending (e.g., "Scanning ./game/art for files >16 MiB…").

## Troubleshooting

- **Database Connection Issues**: Ensure MongoDB is running and the `MONGODB_URI` in your `.env` file is correct.
- **Cache Connection Issues**: Ensure Redis is running and properly configured (though not explicitly in `.env.example`, it might be needed for cache tests).
- **Permission Errors**: Make sure you have the necessary permissions to execute the scripts. Use `chmod +x` on Unix-like systems to make shell scripts executable.
- **MongoDB Tools Missing**: For asset scripts, ensure `mongosh` and `mongofiles` are installed and accessible in your PATH.
- **Asset Script Errors**: Verify the directory paths and MongoDB connection details. Ensure the database and collections specified exist or are accessible.

## Notes

- Always run tests in a development or test environment, not in production.
- Make sure to backup any important data before running tests or reset scripts that might delete or modify data.
- Asset management scripts use a default threshold of 16 MiB to decide between document storage and GridFS; adjust this if needed for your use case.

If you encounter any issues or have questions, please contact the development team or refer to the project's documentation for more detailed information.
