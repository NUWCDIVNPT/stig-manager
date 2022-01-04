#!/bin/bash

# This script must be run from the top-level of the repo.

./client/build.sh

BRANCH=$(git symbolic-ref --short HEAD)
SHA=$(git rev-parse --short=10 HEAD)
DESCRIBE=$(git describe --tags)
TAG=$(git describe --tags --abbrev=0)

docker build \
  --build-arg=COMMIT_BRANCH=$BRANCH \
  --build-arg=COMMIT_SHA=$SHA \
  --build-arg=COMMIT_DESCRIBE=$DESCRIBE \
  --build-arg=COMMIT_TAG=$TAG \
  --no-cache=true \
  --tag stig-manager:$TAG .

docker tag stig-manager:$TAG stig-manager:latest
