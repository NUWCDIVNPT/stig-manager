#!/bin/bash
docker container rm stig-manager-auth --force
docker run --name stig-manager-auth -p 8080:8080 -p 8443:8443 -d stig-manager-auth:${1:-dev}