#!/bin/sh

cd "$MB_ROOT_DIR"
echo "$MB_ROOT_DIR"
cp logs/action.log data/server/
cp logs/request.log data/server/
mv logs/load_itunes_rss* data/server/
mv logs/set_genreid_* data/server/
mv logs/action.log-* data/server/
mv logs/request.log-* data/server/


