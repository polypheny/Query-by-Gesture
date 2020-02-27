#!/usr/bin/env bash

cd ./Deepmime/UI
ng build
ng serve > /dev/null 2>&1 &
cd -
cd ./Deepmime/API
python3 api3DRESNET.py &
pid=$!
cd -
cd ./Bridge
python3 server.py > /dev/null 2>&1 &
pid2=$!

read -p "press"
killall "ng serve"
kill -9 $pid
kill -9 $pid2
