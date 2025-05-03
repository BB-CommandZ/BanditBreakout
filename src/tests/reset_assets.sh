#!/usr/bin/env zsh
#
# reset‐assets.sh
#  - deletes content previously added by assets.sh:
#    • removes large files from GridFS
#    • removes small files’ docs from your collection

# --- USAGE & PARAMETER PARSING ↓──────────────────────────────────────
if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <ASSETS_DIR> [MONGO_URI] [DB] [COLL] [GRIDFS_BUCKET] [THRESHOLD_MiB]"
  echo
  echo "  ASSETS_DIR      directory you originally imported (required)"
  echo "  MONGO_URI       MongoDB URI (default: mongodb://localhost:27017)"
  echo "  DB              database name (default: game_assets)"
  echo "  COLL            small‐file collection (default: assets)"
  echo "  GRIDFS_BUCKET   GridFS bucket prefix (default: assets_fs)"
  echo "  THRESHOLD_MiB   size threshold in MiB (default: 16)"
  exit 1
fi

# positional args + defaults
ASSETS_DIR="$1"
MONGO_URI="${2:-mongodb://localhost:27017}"
DB="${3:-game_assets}"
COLL="${4:-assets}"
GRIDFS_BUCKET="${5:-assets_fs}"
THRESHOLD=$(( ${6:-16} * 1024 * 1024 ))  # bytes

# --- EXCLUDE PATTERNS (same as ingest) ↓─────────────────────────────
EXCLUDE_PATHS=(
  "*/Voice lines/*"
)
EXCLUDE_FILES=(
  "BanditBreakout_hifi.mov"
)

# build a combined prune expression for find()
_prune_expr=""
for p in "${EXCLUDE_PATHS[@]}"; do
  _prune_expr+=" -path \"$p\" -o"
done
for f in "${EXCLUDE_FILES[@]}"; do
  _prune_expr+=" -name \"$f\" -o"
done
_prune_expr="${_prune_expr% -o}"  # remove trailing -o

# -------------------------------------------------------------------

# ensure we can talk to Mongo
for cmd in mongosh mongofiles; do
  if ! command -v $cmd &>/dev/null; then
    echo "Error: '$cmd' not found. Install it or add to your PATH."
    exit 1
  fi
done

# helper for file size
filesize() { stat -f%z "$1"; }

# find exactly the same set of files you ingested, then delete each
eval find "\"\$ASSETS_DIR\"" \
     "\\( $_prune_expr \\) -prune -o" \
     "-type f \\( -iname '*.png' -o -iname '*.svg' -o -iname '*.mp3' -o -iname '*.wav' -o -iname '*.mp4' \\) -print0" \
| while IFS= read -r -d '' file; do
    size=$(filesize "$file")
    rel="${file#"$ASSETS_DIR"/}"        # same “filename” key
    if (( size > THRESHOLD )); then
      echo "🗑️ [GridFS] Deleting $rel"
      mongofiles \
        --uri="$MONGO_URI/$DB" \
        --prefix="$GRIDFS_BUCKET" \
        delete "$rel"
    else
      echo "🗑️ [Doc]    Deleting $rel"
      mongosh "$MONGO_URI/$DB" --quiet <<EOF
db.getCollection("$COLL").deleteOne({ filename: "$rel" });
EOF
    fi
  done

