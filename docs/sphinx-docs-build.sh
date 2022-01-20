#!/bin/bash

# Builds the docs using the Docker image created from the Documentation Dockerfile.

# This script must be run from the repo's /docs directory.

# echo ${PWD}
# sleep 5

docker run --rm -v ${PWD}:/docs sphinx-with-requirements make html