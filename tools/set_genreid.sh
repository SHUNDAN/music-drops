#!/bin/sh

cd "$ITUNES_LOADER_DIR"
node set_genreid.js >> ../logs/set_genreid_`date '+%Y%m%d_%H%M%S'`.log



