#!/bin/bash

# This file is used to build API binaries on the team workstations. It is not tested elsewhere, yet.
# Requires:
# - Node.js and module "pkg" (npm install -g pkg)
# - zip
# - tar


check_exit_status() {
  if [[ $? -eq 0 ]]; then
    echo "[BUILD_TASK] $1 succeeded"
  else
    echo "[BUILD_TASK] $1 failed"
    exit $2
  fi
}

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
npm install -g pkg
cd ..
../client/build.sh
../docs/build.sh

DESCRIBE=$(git describe --tags | sed 's/\(.*\)-.*/\1/')
check_exit_status "Getting latest tag" 4
echo $DESCRIBE

# Make binaries
echo "Building binaries"
pkg -C gzip --public --public-packages=* --no-bytecode pkg.config.json
check_exit_status "Building binaries" 1

echo "Creating archives with launchers"
# Windows archive
zip --junk-paths $DISTDIR/stig-manager-win-$DESCRIBE.zip $LAUNCHERDIR/stig-manager.bat $BINDIR/stig-manager-win.exe
check_exit_status "Zipping Windows Archive" 3

# Linux archive
tar -cJvf $DISTDIR/stig-manager-linux-$DESCRIBE.tar.xz --xform='s|^|stig-manager/|S' -C $LAUNCHERDIR stig-manager.sh -C ../$BINDIR stig-manager-linuxstatic
check_exit_status "Zipping Linux Archive" 4

echo "Build artifacts are in $DISTDIR"