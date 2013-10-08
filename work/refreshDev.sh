#!/bin/sh

echo "START"



# move to git root.
cd ../
pwd

# npm
npm install


# db
mv db/mockbu.db logs/`date "+%Y%m%d_%H%M%S"`mockbu.db
cp db/mockbu-dev.db db/mockbu.db


# setting
mv settings/setting.json logs/`date "+%Y%m%d_%H%M%S"`setting.json
cp settings/setting_bk.json setting.json


# log dir
if [ -e logs ]; then
    echo "logs dir already exists"
else
    mkdir logs
fi



echo "END"

