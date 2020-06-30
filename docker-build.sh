#!/bin/bash

docker build \
  --build-arg=COMMIT_BRANCH=$(git symbolic-ref --short HEAD) \
  --build-arg=COMMIT_SHA=$(git rev-parse --short=10 HEAD) \
  --build-arg=COMMIT_TAG=$(git describe --tags) \
  --no-cache=true \
  --tag stig-manager/api:${1:-dev} .
