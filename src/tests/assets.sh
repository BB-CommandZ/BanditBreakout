#!/usr/bin/env zsh
#
# assets.sh
#  - filters your runtime assets
#  - skips Voice lines & BanditBreakout_hifi.mov
#  - embeds small files via mongosh (fs.readFileSync)
#  - streams large files via mongofiles (--prefix)

# --- USAGE & PARAMETER PARSING ↓──────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <ASSETS_DIR> [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET] [THRESHOLD_MiB]"
  echo
  echo "  ASSETS_DIR      directory containing your assets (required)"
  echo "  MONGO_URI       MongoDB connection URI (default: mongodb://localhost:27017)"
  echo "  DB              database name (default: game_assets)"
  echo "  COLL            collection for small files (default: assets)"
  echo "  GRIDFS_BUCKET   GridFS bucket prefix (default: assets_fs)"
  echo "  THRESHOLD_MiB   size threshold in MiB (default: 16)"
  exit 1
fi

# pull in positional args (with sensible defaults)
ASSETS_DIR="$1"
MONGO_URI="${2:-mongodb://localhost:27017}"
DB="${3:-game_assets}"
COLL="${4:-assets}"
GRIDFS_BUCKET="${5:-assets_fs}"
# threshold in bytes (default 16 MiB)
THRESHOLD=$(( ${6:-16} * 1024 * 1024 ))

# -------------------------------------------------------------------

# ensure mongosh + mongofiles are available
for cmd in mongosh mongofiles; do
  if ! command -v $cmd &>/dev/null; then
    echo "Error: '$cmd' not found. Install it or add to your PATH."
    exit 1
  fi
done

# helper: get filesize in bytes (macOS stat)
filesize() {
  stat -f%z "$1"
}

# walk & filter
find "$ASSETS_DIR" \
  \( -path "*/Voice lines/*" -o -name "BanditBreakout_hifi.mov" \) -prune \
  -o -type f \( -iname '*.png' -o -iname '*.svg' -o -iname '*.mp3' \
               -o -iname '*.wav' -o -iname '*.mp4' \) -print0 \
| while IFS= read -r -d '' file; do
    size=$(filesize "$file")
    rel="${file#"$ASSETS_DIR"/}"               # DB filename
    mime=$(file --brief --mime-type "$file")

    if (( size > THRESHOLD )); then
      echo "🎥 [GridFS] $rel  ($(printf '%.2f' "$((size/1024/1024.0))") MiB)"
      mongofiles \
        --uri="$MONGO_URI/$DB" \
        --prefix="$GRIDFS_BUCKET" \
        put "$rel" --local "$file" --replace
    else
      echo "📄 [Doc]    $rel  ($(printf '%.2f' "$((size/1024/1024.0))") MiB)"
      mongosh "$MONGO_URI/$DB" --quiet <<EOF
const fs = require('fs');
const buf = fs.readFileSync("$file");
db.getSiblingDB("$DB").getCollection("$COLL").insertOne({
  filename: "$rel",
  data: new BinData(0, buf.toString('base64')),
  contentType: "$mime",
  size: buf.length,
  uploadedAt: new Date()
});
EOF
    fi
  done

