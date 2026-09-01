#!/bin/bash

SPHINX_IMAGE_W_REQUIREMENTS=sphinx-w-requirements

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

find _build -type f -not -name '.gitignore' -delete
find _build -type d -empty -delete

docker build -t $SPHINX_IMAGE_W_REQUIREMENTS .

# Mount the repo root so conf.py can copy the API specification into the build
docker run --rm -v "$(realpath ..)":/stig-manager -w /stig-manager/docs $SPHINX_IMAGE_W_REQUIREMENTS make html