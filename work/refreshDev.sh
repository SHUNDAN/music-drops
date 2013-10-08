#!/bin/sh

echo "START"



# move to git root.
cd ../
pwd


# create tmp directory
if [ -e work/tmp ]; then
    echo "work/tmp already extists"
else
    mkdir work/tmp
fi


# npm
npm install


# db
mv db/mockbu.db work/tmp/`date "+%Y%m%d_%H%M%S"`mockbu.db
cp db/mockbu-dev.db db/mockbu.db


# setting
mv settings/setting.json work/tmp/`date "+%Y%m%d_%H%M%S"`setting.json
cp settings/setting_bk.json setting.json


# log dir
if [ -e logs ]; then
    echo "logs dir already exists"
else
    mkdir logs
fi



echo "END"

