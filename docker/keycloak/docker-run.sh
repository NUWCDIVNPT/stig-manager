#!/bin/bash
docker container rm stigman-auth --force
docker run --name stigman-auth -p 8080:8080 -p 8443:8443 -d stigman/auth:${1:-dev}