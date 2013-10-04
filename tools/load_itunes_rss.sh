#!/bin/sh

cd "$ITUNES_LOADER_DIR"
echo "$ITUNES_LOADER_DIR"
node load_itunes_rss.js $1 >> ../logs/load_itunes_rss`date '+%Y%m%d_%H%M%S'`.log



