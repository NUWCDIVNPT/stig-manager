#!/bin/bash

java -jar openapi-generator-cli.jar generate -s -i ../stig-manager.yaml -g nodejs-server-deprecated -t nodejs -o ../../service 
