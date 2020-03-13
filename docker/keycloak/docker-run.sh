#!/bin/bash

docker run -p 8080:8080 -p 8443:8443 stigman/auth:${1:-dev}