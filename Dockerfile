FROM node:12.9.1-buster-slim
LABEL maintainer="carl.a.smigielski@saic.com"
ARG COMMIT_BRANCH="unspecified"
ARG COMMIT_SHA="unspecified"
ARG COMMIT_TAG="unspecified"
ARG COMMIT_DESCRIBE="unspecified"
LABEL commit-branch=${COMMIT_BRANCH}
LABEL commit-sha=${COMMIT_SHA}
LABEL commit-tag=${COMMIT_TAG}
LABEL commit-describe=${COMMIT_DESCRIBE}

# WORKDIR /tmp
# RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get install -y alien libaio1
# RUN wget http://yum.oracle.com/repo/OracleLinux/OL7/oracle/instantclient/x86_64/getPackage/oracle-instantclient19.3-basiclite-19.3.0.0.0-1.x86_64.rpm
# RUN alien -i --scripts oracle-instantclient*.rpm
# RUN rm -f oracle-instantclient19.3*.rpm && apt-get -y autoremove && apt-get -y clean

WORKDIR /home/node
USER node

# Install app dependencies
#COPY ./api/source/package*.json .
COPY --chown=node:node ./api/source .
RUN npm install
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
