# STIG Manager OSS

STIG Manager is an API and Web client for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

Source code: [https://github.com/NUWCDIVNPT/stig-manager](https://github.com/NUWCDIVNPT/stig-manager)

## Quick Start 
*The Quick Start steps are dependent on the [official MySQL 8 image](https://hub.docker.com/_/mysql) and a [custom Keycloak 11 image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth).*

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
      - STIGMAN_API_AUTHORITY=http://auth:8080/auth/realms/stigman
      - STIGMAN_CLASSIFICATION=U
      - STIGMAN_DB_HOST=db
      - STIGMAN_DB_PASSWORD=stigman
      - STIGMAN_INIT_IMPORT_STIGS=true
      - STIGMAN_INIT_IMPORT_SCAP=true
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
API documentation is available at /api-docs
Client is available at /
```
- Navigate to ```http://localhost:54000```
- Login using credentials "admin/password", as documented for [the demonstration Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth)
- Refer to the documentation to create your first Collection

## STIG Manager OSS Environment Variables

The environment variables consumed by the STIG Manager image are:

| Variable | Description | Affects |
| --- | --- | --- |
|STIGMAN_API_ADDRESS|Default: 0.0.0.0<br>The IP address on which the the server will listen |API|
|STIGMAN_API_PORT|Default: 54000<br>The TCP port on which the server will listen |API|
|STIGMAN_API_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The URL of the OIDC authority providing signed JWTs to the API server. The API will append `/.well-known/openid-configuration` to this URL| API|
|STIGMAN_CLASSIFICATION|Default: U<br>Available values: NONE, U, FOUO, C, S, TS, SCI<br>Sets the classification banner, if any. | API, Client|
|STIGMAN_CLIENT_API_BASE|Default: /api<br>The base URL for Client requests to the API relative to the sever root at / | Client|
|STIGMAN_CLIENT_DIRECTORY|Default: ./clients<br>The location of the web client files, relative to the API source directory | API, Client|
|STIGMAN_CLIENT_DISABLED|Default: false<br>Whether to serve the STIG Manager reference web client |API|
|STIGMAN_CLIENT_KEYCLOAK_AUTH|Default: http://localhost:8080/auth<br>The Keycloak authorization URL relative to the Client |Client|
|STIGMAN_CLIENT_KEYCLOAK_CLIENTID|Default: stig-manager<br>The Keycloak client-id of the web client| Client|
|STIGMAN_CLIENT_KEYCLOAK_REALM|Default: stigman<br>The Keycloak realm with STIG Manager users |Client|
|STIGMAN_DB_HOST|Default: localhost<br>The database hostname or IP from to the API server |API|
|STIGMAN_DB_PORT|Default: 50001<br>The database TCP port relative to the API server |API|
|STIGMAN_DB_USER|Default: stigman<br>The user account used to login to the datanase |API|
|STIGMAN_DB_PASSWORD|No default<br>The password used to login to the database |API|
|STIGMAN_DB_SCHEMA|Default: stigman<br>The schema where the STIG Manager object are found |API|
|STIGMAN_DB_TLS_CA_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database. | API|
|STIGMAN_DB_TLS_CERT_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client. Additionaly requires setting values for STIGMAN_DB_TLS_CA_FILE and STIGMAN_DB_TLS_KEY_FILE. | API|
|STIGMAN_DB_TLS_KEY_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client. Additionaly requires setting values for STIGMAN_DB_TLS_CA_FILE and STIGMAN_DB_TLS_CERT_FILE. | API|
|STIGMAN_DB_TYPE|Default: mysql<br>The database type. Valid values are [mysql] | API|
|STIGMAN_INIT_IMPORT_STIGS|Default: false<br>Whether to fetch and import the current DISA STIG Library compilation from public.cyber.mil on initial database migration |API|
|STIGMAN_INIT_IMPORT_SCAP|Default: false<br>Whether to fetch and import current DISA SCAP content from public.cyber.mil on initial database migration  |API|
|STIGMAN_JWT_EMAIL_CLAIM|Default: email<br>The access token claim whose value is the user's email address| API, Client|
|STIGMAN_JWT_NAME_CLAIM|Default: name<br>The access token claim whose value is the user's fullname| API, Client|
|STIGMAN_JWT_ROLES_CLAIM|Default: realm_access?.roles<br>The access token claim whose value is the user's roles| API, Client|
|STIGMAN_JWT_SERVICENAME_CLAIM|Default: clientId<br>The access token claim whose value is the user's username| API, Client|
|STIGMAN_JWT_USERNAME_CLAIM|Default: preferred_username<br>The access token claim whose value is the user's username| API, Client|
|STIGMAN_SWAGGER_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The Keycloak authorization URL relative to the SwaggerUI| API|
|STIGMAN_SWAGGER_ENABLED|Default: false<br>Whether to enable the SwaggerUI SPA at /api-docs | API|
|STIGMAN_SWAGGER_REDIRECT|Default: http://localhost:54000/api-docs/oauth2-redirect.html<br>The redirect URL sent by SwaggerUI to Keycloak when authorizing | API|
|STIGMAN_SWAGGER_SERVER|Default: http://localhost:54000/api<br>The API server relative to the SwaggerUI |API|

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
  -e STIGMAN_API_AUTHORITY=http://<KEYCLOAK_IP>:<KEYCLOAK_PORT>/auth/realms/stigman \
  nuwcdivnpt/stig-manager
```

