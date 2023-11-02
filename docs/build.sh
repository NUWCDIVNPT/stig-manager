#!/bin/bash

SPHINX_IMAGE=sphinxdoc/sphinx:7.1.2
SPHINX_IMAGE_W_REQUIREMENTS=localSphinx/sphinx-w-requirements:latest

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

find _build -type f -not -name '.gitignore' -delete
find _build -type d -empty -delete

docker build -t $SPHINX_IMAGE_W_REQUIREMENTS .

docker run --rm -v $(pwd):/docs $SPHINX_IMAGE_W_REQUIREMENTS \
  /bin/bash -c "make html && chown -R $(id -u):$(id -g) /docs/_build"