#!/bin/bash

docker build \
  --build-arg=COMMIT_BRANCH=$(git symbolic-ref --short HEAD) \
  --build-arg=COMMIT_SHA=$(git rev-parse --short=10 HEAD) \
  --build-arg=COMMIT_TAG=$(git describe --tags) \
  --no-cache=true \
  --tag stig-manager/api:$(git rev-parse --short=10 HEAD) .

docker tag stig-manager/api:$(git rev-parse --short=10 HEAD) stig-manager/api:latest
docker tag stig-manager/api:$(git rev-parse --short=10 HEAD) carlsmig/stig-manager:$(git rev-parse --short=10 HEAD)
docker tag stig-manager/api:$(git rev-parse --short=10 HEAD) carlsmig/stig-manager:latest
