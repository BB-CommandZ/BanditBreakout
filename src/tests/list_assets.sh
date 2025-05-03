#!/usr/bin/env zsh
#
# list_assets.sh
#  - Lists filenames stored in MongoDB collection and GridFS bucket
#  - Displays counts and filenames for both storage types

# --- USAGE & PARAMETER PARSING ↓──────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET]"
  echo
  echo "  MONGO_URI       MongoDB connection URI (default: mongodb://localhost:27017)"
  echo "  DB              database name (default: game_assets)"
  echo "  COLL            collection for small files (default: assets)"
  echo "  GRIDFS_BUCKET   GridFS bucket prefix (default: assets_fs)"
  exit 1
fi

# pull in positional args (with sensible defaults)
MONGO_URI="${1:-mongodb://localhost:27017}"
DB="${2:-game_assets}"
COLL="${3:-assets}"
GRIDFS_BUCKET="${4:-assets_fs}"

# -------------------------------------------------------------------

# ensure mongosh + mongofiles are available
for cmd in mongosh mongofiles; do
  if ! command -v $cmd &>/dev/null; then
    echo "Error: '$cmd' not found. Install it or add to your PATH."
    exit 1
  fi
done

echo "📊 Listing assets in MongoDB database and GridFS..."
echo "=============================================="
echo "Database: $DB"
echo "Collection (small files): $COLL"
echo "GridFS Bucket (large files): $GRIDFS_BUCKET"
echo "=============================================="

# List files in MongoDB Collection
echo "\n📄 Files in MongoDB Collection ($COLL):"
mongosh "$MONGO_URI/$DB" --quiet <<EOF
const collectionFiles = db.getCollection("$COLL").find({}, { filename: 1, _id: 0 });
const count = collectionFiles.count();
print("Total files in collection: " + count + "\n");
if (count > 0) {
    print("Filenames:");
    collectionFiles.forEach(doc => {
        print("  - " + doc.filename);
    });
} else {
    print("  (No files found in collection)");
}
EOF

# List files in GridFS Bucket
echo "\n🎥 Files in GridFS Bucket ($GRIDFS_BUCKET):"
mongofiles --uri="$MONGO_URI/$DB" --prefix="$GRIDFS_BUCKET" list
echo "\n=============================================="
echo "Listing complete."
