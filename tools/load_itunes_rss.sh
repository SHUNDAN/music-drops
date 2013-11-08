#!/bin/sh

cd "$MB_ROOT_DIR"
echo "$MB_ROOT_DIR"
node tools/load_itunes_rss.js $1 >> ./logs/load_itunes_rss`date '+%Y%m%d_%H%M%S'`.log

