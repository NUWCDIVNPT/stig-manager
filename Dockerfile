# STIG Manager OSS
# 
# COPY commands assume the following lines in .dockerignore
# **/node_modules
# **/state.json
# **/README.md
# **/.git
# **/data
# **/docs
# **/test
# **/uploads
# **/docker


FROM node:lts-alpine
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
# RUN npm audit fix

RUN mkdir client
COPY --chown=node:node ./clients/extjs ./client

# Set environment
ENV COMMIT_SHA=${COMMIT_SHA} \
COMMIT_BRANCH=${COMMIT_BRANCH} \
COMMIT_TAG=${COMMIT_TAG} \
COMMIT_DESCRIBE=${COMMIT_DESCRIBE}

EXPOSE 54000
CMD [ "node", "index.js" ]
