# STIG Manager OSS on Docker Hub

*This is pre-release software and the Docker images are made available for pilot testing only*

STIG Manager is an API and Web client for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

**Documentation:** [https://nuwcdivnpt.github.io/stig-manager](https://stig-manager.readthedocs.io/en/latest/)

**Source:** [https://github.com/NUWCDIVNPT/stig-manager](https://github.com/NUWCDIVNPT/stig-manager)

## Supported tags
- From the `node:lts-alpine` base image (the default if no tag is provided)
  - `latest`, `latest-alpine`
- From the [Iron Bank Node.js 14 base image](https://repo1.dso.mil/dsop/opensource/nodejs/nodejs14/)
  - `latest-ironbank`

In addition, we provide a limited selection of releases tagged as *`release`*`[-`*`distro`*`]`, where `distro` defauts to `alpine`. For example, `1.0.0-beta.14` or `1.0.0-beta.14-ironbank`

## Quick Start Orchestration
*The Quick Start steps require the [official MySQL 8 image](https://hub.docker.com/_/mysql) and a [custom Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth).*

### docker-compose.yml
```
# STIG Manager docker-compose orchestration

version: '3.7'

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
    cap_add:
      - SYS_NICE  # workaround MySQL logging bug => mbind: Operation not permitted 
  api:
    image: nuwcdivnpt/stig-manager
    environment:
      - STIGMAN_OIDC_PROVIDER=http://auth:8080/auth/realms/stigman
      - STIGMAN_CLASSIFICATION=U
      - STIGMAN_DB_HOST=db
      - STIGMAN_DB_PASSWORD=stigman
      - STIGMAN_INIT_IMPORT_STIGS=true
      - STIGMAN_INIT_IMPORT_SCAP=true
      # Set envvar below if non-localhost browsers will access the API
      # - STIGMAN_CLIENT_OIDC_PROVIDER=<the Keycloak authorization URL relative to the Client>
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
- On initial container startup, STIG Manager will connect to [DoD Cyber Exchange](https://public.cyber.mil) and import the latest STIG Library Compilation and any available SCAP content.
- When all the services have started, STIG Manager will output:
```
Server is listening on port 54000
API is available at /api
Client is available at /
```
- Navigate to ```http://localhost:54000```
- Login using credentials "admin/password", as documented for [the demonstration Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth)
- Refer to the documentation to create your first Collection

## STIG Manager OSS Environment Variables

Refer to our documentation for the [environment variables consumed by STIG Manager](https://nuwcdivnpt.github.io/stig-manager/#/Environment_Variables) 

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
  mysql:8
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

