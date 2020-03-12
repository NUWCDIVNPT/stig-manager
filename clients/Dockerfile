FROM nginx:1.16.1
LABEL maintainer="carl.a.smigielski@saic.com"
ARG COMMIT_BRANCH="master"
ARG COMMIT_SHA=""
ARG COMMIT_TAG=""
LABEL branch=${COMMIT_BRANCH}
LABEL commit=${COMMIT_SHA}
LABEL tag=${COMMIT_TAG}

# Basic nginx config
COPY ./nginx.conf /etc/nginx/nginx.conf
# The STIG Manager SPA
COPY ./extjs /usr/share/nginx/html

# Default values for the environment
ENV COMMIT_SHA=${COMMIT_SHA} \
COMMIT_BRANCH=${COMMIT_BRANCH} \
COMMIT_TAG=${COMMIT_TAG}

# Run envsubst against client template files for: keycloak.json and Env.js
CMD ["/bin/bash", "-c", "envsubst < /usr/share/nginx/html/js/keycloak.json.template > /usr/share/nginx/html/js/keycloak.json && \
envsubst < /usr/share/nginx/html/js/Env.js.template > /usr/share/nginx/html/js/Env.js && \
nginx -g \"daemon off;\""]
