#!/usr/bin/env bash

cd ./Deepmime/UI
ng build
ng serve > /dev/null 2>&1 &
pid3=$!

cd -
cd ./Deepmime/API
python3 api3DRESNET.py &
pid2=$!

cd -
cd ./Bridge
python3 server.py > /dev/null 2>&1 &
pid=$!

trap "kill -9 `echo $pid3` & kill -9 `echo $pid2` & kill -9 `echo $pid`" EXIT

read -p " "