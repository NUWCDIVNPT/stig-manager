# STIG Manager OSS Environment Variables

The environment variables consumed by the STIG Manager image are:

| Variable | Description | Affects |
| --- | --- | --- |
|STIGMAN_API_ADDRESS|Default: 0.0.0.0<br>The IP address on which the the server will listen |API|
|STIGMAN_API_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The URL of the OIDC authority providing signed JWTs to the API server. The API will append `/.well-known/openid-configuration` to this URL| API|
|STIGMAN_API_MAX_JSON_BODY|Default: 5242880<br>The maximum size in bytes of the request body when Content-Type is application/json| API|
|STIGMAN_API_MAX_UPLOAD|Default: 1073741824<br>The maximum size in bytes of the file uploaded with Content-Type multipart/form-data| API|
|STIGMAN_API_PORT|Default: 54000<br>The TCP port on which the server will listen |API|
|STIGMAN_CLASSIFICATION|Default: U<br>Available values: NONE, U, FOUO, C, S, TS, SCI<br>Sets the classification banner, if any. | API, Client|
|STIGMAN_CLIENT_API_BASE|Default: /api<br>The base URL for Client requests to the API relative to the sever root at / | Client|
|STIGMAN_CLIENT_DIRECTORY|Default: ./clients<br>The location of the web client files, relative to the API source directory | API, Client|
|STIGMAN_CLIENT_DISABLED|Default: false<br>Whether to serve the STIG Manager reference web client |API|
|STIGMAN_CLIENT_KEYCLOAK_AUTH|Default: http://localhost:8080/auth<br>The Keycloak authorization URL relative to the Client |Client|
|STIGMAN_CLIENT_KEYCLOAK_CLIENTID|Default: stig-manager<br>The Keycloak client-id of the web client| Client|
|STIGMAN_CLIENT_KEYCLOAK_REALM|Default: stigman<br>The Keycloak realm with STIG Manager users |Client|
|STIGMAN_DB_HOST|Default: localhost<br>The database hostname or IP from to the API server |API|
|STIGMAN_DB_MAX_CONNECTIONS|Default: 25<br>The maximum size of the database connection pool |API|
|STIGMAN_DB_PASSWORD|No default<br>The password used to login to the database |API|
|STIGMAN_DB_PORT|Default: 3306<br>The database TCP port relative to the API server |API|
|STIGMAN_DB_SCHEMA|Default: stigman<br>The schema where the STIG Manager object are found |API|
|STIGMAN_DB_TLS_CA_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database. | API|
|STIGMAN_DB_TLS_CERT_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client. Additionally requires setting values for STIGMAN_DB_TLS_CA_FILE and STIGMAN_DB_TLS_KEY_FILE. | API|
|STIGMAN_DB_TLS_KEY_FILE|No default<br>A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client. Additionally requires setting values for STIGMAN_DB_TLS_CA_FILE and STIGMAN_DB_TLS_CERT_FILE. | API|
|STIGMAN_DB_TYPE|Default: mysql<br>The database type. Valid values are [mysql] | API|
|STIGMAN_DB_USER|Default: stigman<br>The user account used to login to the database |API|
|STIGMAN_INIT_IMPORT_STIGS|Default: false<br>Whether to fetch and import the current DISA STIG Library compilation from public.cyber.mil on initial database migration |API|
|STIGMAN_INIT_IMPORT_SCAP|Default: false<br>Whether to fetch and import current DISA SCAP content from public.cyber.mil on initial database migration  |API|
|STIGMAN_JWT_EMAIL_CLAIM|Default: email<br>The access token claim whose value is the user's email address| API, Client|
|STIGMAN_JWT_NAME_CLAIM|Default: name<br>The access token claim whose value is the user's full name| API, Client|
|STIGMAN_JWT_ROLES_CLAIM|Default: realm_access?.roles<br>The access token claim whose value is the user's roles| API, Client|
|STIGMAN_JWT_SERVICENAME_CLAIM|Default: clientId<br>The access token claim whose value is the user's username| API, Client|
|STIGMAN_JWT_USERNAME_CLAIM|Default: preferred_username<br>The access token claim whose value is the user's username| API, Client|
|STIGMAN_SWAGGER_AUTHORITY|Default: http://localhost:8080/auth/realms/stigman<br>The Keycloak authorization URL relative to the SwaggerUI| API|
|STIGMAN_SWAGGER_ENABLED|Default: false<br>Whether to enable the SwaggerUI SPA at /api-docs | API|
|STIGMAN_SWAGGER_REDIRECT|Default: http://localhost:54000/api-docs/oauth2-redirect.html<br>The redirect URL sent by SwaggerUI to Keycloak when authorizing | API|
|STIGMAN_SWAGGER_SERVER|Default: http://localhost:54000/api<br>The API server relative to the SwaggerUI |API|


