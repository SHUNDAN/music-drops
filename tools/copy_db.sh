#!/bin/sh

cd "$MB_ROOT_DIR"
echo "$MB_ROOT_DIR"

cp db/mockbu.db db/backup/`date "+%Y%m%d_%H%M%S"`_mockbu.db
cp db/mockbu.db db/mockbu-dev.db


