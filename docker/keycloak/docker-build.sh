#!/bin/bash

docker build --tag stigman /auth:${1:-dev} .