#!/bin/bash

# This file is used to build API binaries on the team workstations. It is not tested elsewhere, yet.
# Requires:
# - Node.js and module "pkg" (npm install -g pkg)
# - zip
# - tar
# - gpg, if you wish to produce detached signatures

KEYRING=stig-manager.gpg 
SIGNING_KEY="nuwcdivnpt-bot@users.noreply.github.com"

LAUNCHERDIR=launchers
BINDIR=bin
DISTDIR=dist

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

# Prepare
[ ! -d "$BINDIR" ] && mkdir -p "$BINDIR"
[ ! -d "$DISTDIR" ] && mkdir -p "$DISTDIR"
rm -rf $BINDIR/*
rm -rf $DISTDIR/*
echo "Fetching node_modules"
rm -rf ./source/node_modules
cd ./source
npm ci
cd ..
../client/build.sh

# Make binaries
echo "Building binaries"
pkg -C gzip --public --public-packages=* --no-bytecode pkg.config.json

echo "Creating archives with launchers"
# Windows archive
zip --junk-paths $DISTDIR/stig-manager-win.zip $LAUNCHERDIR/stig-manager.bat $BINDIR/stig-manager-win.exe
[[ $1 == "--sign" ]] && gpg --keyring $KEYRING --default-key $SIGNING_KEY --armor --detach-sig  $DISTDIR/stig-manager-win.zip

# Linux archive
tar -cJvf $DISTDIR/stig-manager-linux.tar.xz --xform='s|^|stig-manager/|S' -C $LAUNCHERDIR stig-manager.sh -C ../$BINDIR stig-manager-linuxstatic
[[ $1 == "--sign" ]] && gpg --keyring $KEYRING --default-key $SIGNING_KEY --armor --detach-sig $DISTDIR/stig-manager-linux.tar.xz

echo "Build artifacts are in $DISTDIR"
