# STIG Manager OSS
# 
# COPY commands assume the following lines in .dockerignore
# **/node_modules
# **/state.json
# **/README.md
# **/.git
# **/.gitignore
# **/data
# **/docs
# **/test
# **/uploads
# **/docker

ARG BASE_IMAGE="node:lts-alpine"
FROM ${BASE_IMAGE}
LABEL maintainer="carl.a.smigielski@saic.com"
ARG COMMIT_BRANCH="unspecified"
ARG COMMIT_SHA="unspecified"
ARG COMMIT_TAG="unspecified"
ARG COMMIT_DESCRIBE="unspecified"
LABEL commit-branch=${COMMIT_BRANCH}
LABEL commit-sha=${COMMIT_SHA}
LABEL commit-tag=${COMMIT_TAG}
LABEL commit-describe=${COMMIT_DESCRIBE}

WORKDIR /home/node
USER node

# Install app dependencies
COPY --chown=node:node ./api/source .
RUN npm ci

RUN mkdir client
# Requires the client build files. Alternatively, copy ./client/src 
COPY --chown=node:node ./client/dist ./client

RUN mkdir docs
COPY --chown=node:node ./docs/_build/html ./docs

# Ensure sticky bit is set on all world-writable directories (fixes tenable 1000749)
USER root
RUN df -P | awk {'if (NR!=1) print $6'} | xargs -I '{}' find '{}' -xdev -type d -perm -0002 2>/dev/null | xargs chmod a+t 2>/dev/null | echo 'tenable 1000749'
USER node

# Set environment
ENV COMMIT_SHA=${COMMIT_SHA} \
COMMIT_BRANCH=${COMMIT_BRANCH} \
COMMIT_TAG=${COMMIT_TAG} \
COMMIT_DESCRIBE=${COMMIT_DESCRIBE} \
STIGMAN_CLIENT_DIRECTORY=./client \
STIGMAN_DOCS_DIRECTORY=./docs

EXPOSE 54000
HEALTHCHECK --interval=120s --timeout=3s --start-period=120s CMD node healthcheck.js
CMD [ "node", "index.js" ]
