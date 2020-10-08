# STIG Manager OSS Environment Variables

The environment variables consumed by the STIG Manager image are:

| Variable | Description | Affects |
| --- | --- | --- |
|STIGMAN_API_IMPORT_STIGS|Default: false<br>Whether to import the latest DISA STIG Library compilation on process start  |API|
|STIGMAN_API_IMPORT_SCAP|Default: false<br>Whether to import the latest DISA SCAP content on process start  |API|
|STIGMAN_API_PORT|Default: 54000<br>The TCP port the server will listen on |API|
|STIGMAN_API_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The Keycloak authority URL relative to the API container| API|
|STIGMAN_CLASSIFICATION|Default: U<br>Available values: NONE, U, FOUO, C, S, TS, SCI<br>Sets the classification banner, if any. | API, Client|
|STIGMAN_CLIENT_API_BASE|Default: /api<br>The API URL relative to the sever root at / | Client|
|STIGMAN_CLIENT_DIRECTORY|Default: ./clients<br>The location of the web client files relative to the API source in /home/node | API, Client|
|STIGMAN_CLIENT_ENABLED|Default: true<br>Whether to serve the STIG Manager reference web client |API, Client|
|STIGMAN_CLIENT_KEYCLOAK_AUTH|Default: http://localhost:8080/auth<br>The Keycloak authorization URL relative to the Client |Client|
|STIGMAN_CLIENT_KEYCLOAK_REALM|Default: stigman<br>The Keycloak realm with STIG Manager users |Client|
|STIGMAN_CLIENT_KEYCLOAK_CLIENTID|Default: stig-manager<br>The Keycloak client-id of the web client| Client|
|STIGMAN_JWT_USER_CLAIM|Default: preferred_username<br>The Keycloak claim in the access token that STIG Manager should look to for the user's username| Client|
|STIGMAN_DB_HOST|Default: localhost<br>The database hostname/IP relative to the API container |API|
|STIGMAN_DB_PORT|Default: 50001<br>The database TCP port relative to the API container |API|
|STIGMAN_DB_USER|Default: stigman<br>The user account used to login to the datanase |API|
|STIGMAN_DB_PASSWORD|Default: stigman<br>The password used to login to the database |API|
|STIGMAN_DB_SCHEMA|Default: stigman<br>The schema where the STIG Manager object are found |API|
|STIGMAN_DB_TYPE|Default: mysql<br>The database type. Valid values are [mysql] | API|
|STIGMAN_SUPERUSER|Default: admin<br>The privileged user created on startup if no other users are found | API|
|STIGMAN_SWAGGER_ENABLED|Default: true<br>Whether to enable the SwaggerUI single-page-app at /api-docs | API|
|STIGMAN_SWAGGER_SERVER|Default: http://localhost:54000/api<br>The API server relative to the SwaggerUI |API|
|STIGMAN_SWAGGER_REDIRECT|Default: http://localhost:54000/api-docs/oauth2-redirect.html<br>The redirect URL sent by SwaggerUI to Keycloak when authorizing | API|
|STIGMAN_SWAGGER_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The Keycloak authorization URL relative to the SwaggerUI| API|


