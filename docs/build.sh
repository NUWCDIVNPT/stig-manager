#!/bin/bash

SPHINX_IMAGE=sphinxdoc/sphinx:7.1.2

# Change to this script directory
cd "$(dirname "$(realpath "$0")")"

find _build -type f -not -name '.gitignore' -delete
find _build -type d -empty -delete

docker run --rm -v $(pwd):/docs $SPHINX_IMAGE \
  /bin/bash -c "pip3 install -r /docs/requirements.txt && make html && chown -R $(id -u):$(id -g) /docs/_build"