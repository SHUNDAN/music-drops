#!/bin/sh

echo "START"



# move to git root.
cd ../
pwd

# npm
npm install


# db
rm db/mockbu.db
cp db/mockbu-dev.db db/mockbu.db


# setting
rm settings/setting.json
cp settings/setting_bk.json setting.json


# log dir
if [ -e logs ]; then
    echo "logs dir already exists"
else
    mkdir logs
fi



echo "END"

