#!/bin/bash

DIR=deploy
if [ -z "$GOPATH" ] 
then
export GOPATH=/Users/gmelson/Projects/trackdays/AAGSNC/main/go:$GOPATH
fi
if [ -z "$GRADLE_HOME" ] 
then
export GRADLE_HOME=/Users/gmelson/Projects/gradle-1.3
export PATH=$GRADLE_HOME/bin:$PATH
fi
go build ../../../go/src/persotool.go
zip  deploy flexigrid* persoclient.css persoclient.dart.js startup.html persotool
zip deploy -ur images
zip deploy -ur packages
rm deploy/deploy.zip
mv deploy.zip deploy
