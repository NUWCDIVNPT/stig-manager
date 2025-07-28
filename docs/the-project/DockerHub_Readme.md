# STIG Manager OSS on Docker Hub

STIG Manager is an API and Web client for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

**Documentation:** [https://stig-manager.readthedocs.io/en/latest/](https://stig-manager.readthedocs.io/en/latest/)

**Source:** [https://github.com/NUWCDIVNPT/stig-manager](https://github.com/NUWCDIVNPT/stig-manager)

## Supported tags

Built from the current HEAD of our `main` branch: 
  - `nuwcdivnpt/stig-manager:latest`
    - uses the `node:lts-alpine` base image
  - `nuwcdivnpt/stig-manager:latest-ironbank`
    - uses the [Iron Bank Node.js base image](https://repo1.dso.mil/dsop/opensource/nodejs/nodejs18/)


Built from a point release tag on our `main` branch:
  - `nuwcdivnpt/stig-manager:<point-release>`
    - uses the `node:lts-alpine` base image
  - `nuwcdivnpt/stig-manager:<point-release>-ironbank`
    - uses the [Iron Bank Node.js base image](https://repo1.dso.mil/dsop/opensource/nodejs/nodejs18/)
  - For example, `nuwcdivnpt/stig-manager:1.5.2` or `nuwcdivnpt/stig-manager:1.5.2-ironbank`

## Quick Start Orchestration

**IMPORTANT: The Quick Start orchestration is not a production-ready deployment. It is offered as a basic example showing how the API can be configured to integrate with a MySQL instance and an OAuth2 Provider. It is offered for demonstration purposes only and is missing key features such as, but not limited to: CAC authentication, Active Directory integration, persistent data storage, MTLS database connections, logfile archiving, etc.**

*The Quick Start steps require the [official MySQL 8 image](https://hub.docker.com/_/mysql) and a [custom Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth).*

### docker-compose.yml
```
# STIG Manager docker-compose orchestration

services:
  auth:
    image: nuwcdivnpt/stig-manager-auth
    ports:
      - "8080:8080"
  db:
    image: mysql:8.0
    ports:
      - "50001:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=rootpw
      - MYSQL_USER=stigman
      - MYSQL_PASSWORD=stigman
      - MYSQL_DATABASE=stigman
    command: --innodb-buffer-pool-size=1024M --sort_buffer_size=16M 

    cap_add:
      - SYS_NICE  # workaround MySQL logging bug => mbind: Operation not permitted 
  api:
    image: nuwcdivnpt/stig-manager:latest
    environment:
      - STIGMAN_OIDC_PROVIDER=http://auth:8080/realms/stigman
      - STIGMAN_CLASSIFICATION=U
      - STIGMAN_DB_HOST=db
      - STIGMAN_DB_PASSWORD=stigman
      # Change envvar below if non-localhost browsers will access the API
      - STIGMAN_CLIENT_OIDC_PROVIDER=http://localhost:8080/realms/stigman
      # Customize the Welcome widget on the Home tab
      # - STIGMAN_CLIENT_WELCOME_IMAGE=<client-relative-url-to-your-logo>
      - STIGMAN_CLIENT_WELCOME_TITLE=Deployment Information
      - STIGMAN_CLIENT_WELCOME_MESSAGE=Your deployment's Support process can be described here. You can provide a link below.
      - STIGMAN_CLIENT_WELCOME_LINK=http://link_to_help_pages

    init: true
    ports:
      - "54000:54000"
```
### Steps
- Create a ```docker-compose.yml``` file with the content above.
- From the directory containing ```docker-compose.yml```, run:
```
$ docker-compose up -d && docker-compose logs -f
```
- STIG Manager will wait for MySQL and Keycloak to become ready
- When MySQL is ready, STIG Manager will perform an initial migration and create the necessary schema objects.
- When STIG Manager is ready to handle requests, it will output a JSON log entry similar to:
```
{"date":"2022-02-18T18:25:50.749Z","level":3,"component":"index","type":"started","data":{"durationS":0.956811184,"port":"54000","api":"/api","client":"/","documentation":"/docs","swagger":"/api-docs"}}
```
- Navigate to ```http://localhost:54000```
- Login using credentials "admin/password", as documented for [the demonstration Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth)
- Refer to the documentation to create your first Collection

## STIG Manager OSS Environment Variables

Refer to our documentation for the [environment variables consumed by STIG Manager](https://stig-manager.readthedocs.io/en/latest/installation-and-setup/environment-variables.html) 

## STIG Manager Container Healthcheck

The container's Healthcheck starts 120 seconds after startup, and polls the API /op/configuration endpoint every 30 seconds for an acceptable status code.

## Running as individual containers
### Keycloak
```
docker run --name stig-manager-auth \
  -p 8080:8080 \
  -p 8443:8443 \
  nuwcdivnpt/stig-manager-auth
```

### Mysql
```
docker run --name stig-manager-db \
  -p 50001:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpw \
  -e MYSQL_DATABASE=stigman \
  -e MYSQL_USER=stigman \
  -e MYSQL_PASSWORD=stigman \
  mysql:8 --innodb-buffer-pool-size=1024M --sort_buffer_size=16M
```

### API
```
docker run --name stig-manager-api \
  -p 54000:54000 \
  -e STIGMAN_DB_HOST=<DATABASE_IP> \
  -e STIGMAN_DB_PORT=<DATABASE_PORT> \
  -e STIGMAN_OIDC_PROVIDER=http://<KEYCLOAK_IP>:<KEYCLOAK_PORT>/auth/realms/stigman \
  nuwcdivnpt/stig-manager
```

