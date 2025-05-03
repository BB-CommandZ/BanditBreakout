#!/usr/bin/env zsh
# list-large.sh — print all files >16 MiB under a directory

# directory to search (default to current)
dir=${1:-.}

echo "Scanning $dir for files >16 MiB…"

# find all regular files bigger than 16 MiB, print size+path, then sort by size descending
find "$dir" -type f -size +16M \
  -exec du -h {} +  \
  | sort -hr

