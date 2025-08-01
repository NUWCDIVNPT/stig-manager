#==============================================================================
# STIGMAN_API_ADDRESS
#
#  | Default: "0.0.0.0" | The IP address on which the the API server will listen
#
#  Affects: API
#==============================================================================
# export STIGMAN_API_ADDRESS=

#==============================================================================
# STIGMAN_API_MAX_JSON_BODY
#
#  | Default: "5242880" | The maximum size in bytes of the request body when
#  Content-Type is application/json
#
#  Affects: API
#==============================================================================
# export STIGMAN_API_MAX_JSON_BODY=

#==============================================================================
# STIGMAN_API_MAX_UPLOAD
#
#  | Default: "1073741824" | The maximum size in bytes of the file uploaded with
#  Content-Type multipart/form-data
#
#  Affects: API
#==============================================================================
# export STIGMAN_API_MAX_UPLOAD=

#==============================================================================
# STIGMAN_API_PORT
#
#  | Default: "54000" | The TCP port on which the server will listen
#
#  Affects: API
#==============================================================================
# export STIGMAN_API_PORT=

#==============================================================================
# STIGMAN_CLASSIFICATION
#
#  | Default: "U" | Sets the classification banner, if any. Available values:
#  "NONE" "U" "CUI" "C" "S" "TS" "SCI"
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_CLASSIFICATION=

#==============================================================================
# STIGMAN_CLIENT_API_BASE
#
#  | Default: "./api" | The base URL for Client requests to the API relative to
#  the sever root at /
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_API_BASE=

#==============================================================================
# STIGMAN_CLIENT_DIRECTORY
#
#  | Default: "./clients" | The location of the web client files, relative to
#  the API source directory. Note that if running source from a clone of the
#  GitHub repository, the client is located at `../../clients` relative to the
#  API directory.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_CLIENT_DIRECTORY=

#==============================================================================
# STIGMAN_CLIENT_DISABLED
#
#  | Default: "false" | Whether to *not* serve the reference web client
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_DISABLED=

#==============================================================================
# STIGMAN_CLIENT_DISPLAY_APPMANAGERS
#
#  | Default: "true" | Whether to display application managers the home page of
#  web client
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_DISPLAY_APPMANAGERS=

#==============================================================================
# STIGMAN_CLIENT_EXTRA_SCOPES
#
#  | No default. | A space separated list of OAuth2 scopes to request in
#  addition to "stig-manager:stig" "stig-manager:stig:read" "stig-
#  manager:collection" "stig-manager:user" "stig-manager:user:read" "stig-
#  manager:op". Some OIDC providers (Okta) generate a refresh token only if the
#  scope "offline_access" is requested
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_EXTRA_SCOPES=

#==============================================================================
# STIGMAN_CLIENT_ID
#
#  | Default: "stig-manager" | The OIDC clientId of the web client
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_ID=

#==============================================================================
# STIGMAN_CLIENT_ADMIN_TIMEOUT
#
#  | Default: "0" | The maximum time (in minutes) a user with admin privileges
#  can be inactive in the web client before discarding their access token and
#  requiring reauthorization. Activity is defined as mouse click, keypress, or
#  scrolling in any tab or window of a same-origin browsing context group. Set
#  to zero to disable idle detection.
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_ADMIN_TIMEOUT=

#==============================================================================
# STIGMAN_CLIENT_OIDC_PROVIDER
#
#  | Default: Value of "STIGMAN_OIDC_PROVIDER" | Client override of the base URL
#  of the OIDC provider issuing signed JWTs for the API.  The string "/.well-
#  known/openid-configuration" will be appended by the client when fetching
#  metadata.
#
#  Affects: Client 
#==============================================================================
# export STIGMAN_CLIENT_OIDC_PROVIDER=

#==============================================================================
# STIGMAN_CLIENT_SCOPE_PREFIX
#
#  | No default. | String used as a prefix for each scope when authenticating to
#  the OIDC Provider. Some providers (Azure AD) expect scope requests in the
#  format "api://<application_id>/<scope>", where "api://<application_id>/" is
#  the required prefix.
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_SCOPE_PREFIX=

#==============================================================================
# STIGMAN_CLIENT_REAUTH_ACTION
#
#  | Default: "popup" | How to prompt for re-authentication when user
#  credentials expire. Available values: "popup", "iframe", "tab", or "reload".
#  See `detailed description. <../installation-and-
#  setup/authentication.html#stigman-client-reauth-action>`_
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_REAUTH_ACTION=

#==============================================================================
# STIGMAN_CLIENT_RESPONSE_MODE
#
#  | Default: "fragment" | The response_mode the web client should specify when
#  requesting an authorization code from the OIDC provider. Available values:
#  "fragment", "query"
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_RESPONSE_MODE=

#==============================================================================
# STIGMAN_CLIENT_STRICT_PKCE
#
#  | Default: "true" | Whether the web client verifies the OIDC provider is
#  advertising PKCE/S256 support in compliance with RFC 8414. A non-compliant
#  provider supports PKCE/S256 without advertising it. Independent of this
#  value, the web client always exclusively uses PKCE/S256 in the Authorization
#  Code Flow.
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_STRICT_PKCE=

#==============================================================================
# STIGMAN_CLIENT_USER_TIMEOUT
#
#  | Default: "0" | The maximum time (in minutes) a regular user can be inactive
#  in the web client before discarding their access token and requiring
#  reauthorization. Activity is defined as mouse click, keypress, or scrolling
#  in any tab or window of a same-origin browsing context group. Set to zero to
#  disable idle detection.
#
#  Affects: Client
#==============================================================================
# export STIGMAN_CLIENT_USER_TIMEOUT=

#==============================================================================
# STIGMAN_CLIENT_WELCOME_IMAGE 
#
#  | No default. | The URL of an image hosted elsewhere that will be rendered in
#  the Home tab Welcome widget. The STIGMan app does not serve the image itself,
#  only the reference to it. The URL should be in relation to and accessible
#  from the client's browser. The image will be scaled to a max width or height
#  of 125 pixels - If no alternate image is specified, the seal of the
#  Department of the Navy (the project sponsor)  will be displayed.
#
#  Affects: Client Appearance
#==============================================================================
# export STIGMAN_CLIENT_WELCOME_IMAGE =

#==============================================================================
# STIGMAN_CLIENT_WELCOME_LINK
#
#  | No default. | Value of an optional link that will follow the Welcome
#  message in the Home tab Welcome widget.
#
#  Affects: Client Appearance
#==============================================================================
# export STIGMAN_CLIENT_WELCOME_LINK=

#==============================================================================
# STIGMAN_CLIENT_WELCOME_MESSAGE 
#
#  | No default. | Text that will be displayed in the Home tab Welcome widget.
#
#  Affects: Client Appearance     
#==============================================================================
# export STIGMAN_CLIENT_WELCOME_MESSAGE =

#==============================================================================
# STIGMAN_CLIENT_WELCOME_TITLE 
#
#  | Default: "Support" | The tile that will be displayed for the custom Home
#  tab Welcome message.
#
#  Affects: Client Appearance
#==============================================================================
# export STIGMAN_CLIENT_WELCOME_TITLE =

#==============================================================================
# STIGMAN_DB_HOST
#
#  | Default: "localhost" | The database hostname or IP from to the API server
#
#  Affects: API
#==============================================================================
# export STIGMAN_DB_HOST=

#==============================================================================
# STIGMAN_DB_MAX_CONNECTIONS
#
#  | Default: "25" | The maximum size of the database connection pool
#
#  Affects: API
#==============================================================================
# export STIGMAN_DB_MAX_CONNECTIONS=

#==============================================================================
# STIGMAN_DB_PASSWORD
#
#  | No default. | The password used to login to the database
#
#  Affects: API
#==============================================================================
# export STIGMAN_DB_PASSWORD=

#==============================================================================
# STIGMAN_DB_PORT
#
#  | Default: "3306" | The database TCP port relative to the API server
#
#  Affects: API          
#==============================================================================
# export STIGMAN_DB_PORT=

#==============================================================================
# STIGMAN_DB_SCHEMA
#
#  | Default: "stigman" | The schema where the STIG Manager object are found
#
#  Affects: API          
#==============================================================================
# export STIGMAN_DB_SCHEMA=

#==============================================================================
# STIGMAN_DB_TLS_CA_FILE
#
#  | No default. | A file/path relative to the API /tls directory that contains
#  the PEM encoded CA certificate used to sign the database TLS certificate.
#  Setting this variable enables TLS connections to the database.
#
#  Affects: API          
#==============================================================================
# export STIGMAN_DB_TLS_CA_FILE=

#==============================================================================
# STIGMAN_DB_TLS_CERT_FILE
#
#  | No default. | A file/path relative to the API /tls directory that contains
#  the PEM encoded Client certificate used when authenticating the database
#  client. Additionally requires setting values for "STIGMAN_DB_TLS_CA_FILE" and
#  "STIGMAN_DB_TLS_KEY_FILE".
#
#  Affects: API          
#==============================================================================
# export STIGMAN_DB_TLS_CERT_FILE=

#==============================================================================
# STIGMAN_DB_TLS_KEY_FILE
#
#  | No default. | A file/path relative to the API /tls directory that contains
#  the PEM encoded Client private key used when authenticating the database
#  client. Additionally requires setting values for "STIGMAN_DB_TLS_CA_FILE" and
#  "STIGMAN_DB_TLS_CERT_FILE".
#
#  Affects: API          
#==============================================================================
# export STIGMAN_DB_TLS_KEY_FILE=

#==============================================================================
# STIGMAN_DB_USER
#
#  | Default: "stigman" | The user account used to login to the database
#
#  Affects: API    
#==============================================================================
# export STIGMAN_DB_USER=

#==============================================================================
# STIGMAN_DEPENDENCY_RETRIES
#
#  | Default: "24" | During startup, the number of attempts made to establish
#  connections to the database and OIDC Provider. Retries are made every 5
#  seconds and the API process exits if unsuccessful.
#
#  Affects: API
#==============================================================================
# export STIGMAN_DEPENDENCY_RETRIES=

#==============================================================================
# STIGMAN_DEV_ALLOW_INSECURE_TOKENS
#
#  | Default: "false" | Controls whether known insecure JWT signing keys are
#  allowed. Only for development/testing purposes. Setting to 'true' is NOT
#  recommended for production environments.
#
#  Affects: API
#==============================================================================
# export STIGMAN_DEV_ALLOW_INSECURE_TOKENS=

#==============================================================================
# STIGMAN_DEV_LOG_OPT_STATS
#
#  | Default: "true" | Controls whether the API will track API operation
#  statistics used for populating "Requests" portion of "/op/appinfo" response
#  body. Setting to 'false' is NOT recommended for production environments, as
#  this info can be useful for troubleshooting.
#
#  Affects: API
#==============================================================================
# export STIGMAN_DEV_LOG_OPT_STATS=

#==============================================================================
# STIGMAN_DEV_RESPONSE_VALIDATION
#
#  | Default: "none" | Controls whether the API will perform response validation
#  on API responses. If set to 'logOnly' the API will output log entries
#  indicating deviations from the OAS specification. Intended for
#  development/testing purposes. Available values: "none", "logOnly"
#
#  Affects: API
#==============================================================================
# export STIGMAN_DEV_RESPONSE_VALIDATION=

#==============================================================================
# STIGMAN_DOCS_DIRECTORY
#
#  | Default: "./docs" | The location of the documentation files, relative to
#  the API source directory. Note that if running source from a clone of the
#  GitHub repository, the docs are located at `../../docs/_build/html` relative
#  to the API directory.
#
#  Affects: API, documentation
#==============================================================================
# export STIGMAN_DOCS_DIRECTORY=

#==============================================================================
# STIGMAN_DOCS_DISABLED
#
#  | Default: "false" | Whether to *not* serve the project Documentation.  NOTE:
#  If you choose to serve the Client from the API container but not the
#  Documentation, the links do the Docs on the home page will not work.
#
#  Affects: Documentation                
#==============================================================================
# export STIGMAN_DOCS_DISABLED=

#==============================================================================
# STIGMAN_EXPERIMENTAL_APPDATA
#
#  | Default:  "false" | Set to "true" to enable the experimental AppData
#  import/export API endpoints and User Interface.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_EXPERIMENTAL_APPDATA=

#==============================================================================
# STIGMAN_LOG_LEVEL
#
#  | Default: "3" | Controls the granularity of the generated log output, from 1
#  to 4. Each level is inclusive of the ones before it. Level 1 will log only
#  errors, level 2 includes warnings, level 3 includes status and transaction
#  logs, and level 4 includes debug-level logs
#
#  Affects: API
#==============================================================================
# export STIGMAN_LOG_LEVEL=

#==============================================================================
# STIGMAN_LOG_MODE
#
#  | Default: "combined" | Controls whether the logs will create one “combined”
#  log entry for http requests that includes both the request and response
#  information; or two separate log entries, one for the request and one for the
#  response, that can be correlated via a generated Request GUID in each entry
#
#  Affects: API
#==============================================================================
# export STIGMAN_LOG_MODE=

#==============================================================================
# STIGMAN_JWKS_CACHE_MAX_AGE
#
#  | Default: "10" | The time in minutes after which the API's cache of JWT
#  signing keys is deemed stale and the API becomes unavailable. Cache refreshes
#  are scheduled at intervals of half this value and also occur when an unknown
#  signing key is presented. Scheduled refresh failures are retried every 10
#  seconds.
#
#  Affects: API
#==============================================================================
# export STIGMAN_JWKS_CACHE_MAX_AGE=

#==============================================================================
# STIGMAN_JWT_ASSERTION_CLAIM
#
#  | Default: "jti" | The access token claim whose value is the OIDC provider's
#  Assertion ID. Updates to this value trigger the API to update a User's
#  "lastClaims" property. The claim MUST NOT be nested and MUST be a valid
#  ECMAScript identifier.
#
#  Affects: API
#==============================================================================
# export STIGMAN_JWT_ASSERTION_CLAIM=

#==============================================================================
# STIGMAN_JWT_AUD_VALUE
#
#  | No default. | If present, a string which must be included in the access
#  token "aud" claim for requests to endpoints requiring authorization.
#
#  Affects: API
#==============================================================================
# export STIGMAN_JWT_AUD_VALUE=

#==============================================================================
# STIGMAN_JWT_EMAIL_CLAIM
#
#  | Default: "email" | The access token claim whose value is the user's email
#  address. The claim MUST NOT be nested and MUST be a valid ECMAScript
#  identifier.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_EMAIL_CLAIM=

#==============================================================================
# STIGMAN_JWT_NAME_CLAIM
#
#  | Default: "name" | The access token claim whose value is the user's full
#  name. The claim MUST NOT be nested and MUST be a valid ECMAScript identifier.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_NAME_CLAIM=

#==============================================================================
# STIGMAN_JWT_PRIVILEGES_CLAIM
#
#  | Default: "realm_access.roles" | The access token claim whose value is the
#  user’s privileges. The claim MAY be nested but SHOULD avoid invalid
#  ECMAScript identifiers.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_PRIVILEGES_CLAIM=

#==============================================================================
# STIGMAN_JWT_SCOPE_CLAIM
#
#  | Default: "scope" | The access token claim whose value is the user's scopes.
#  Some OIDC Providers (Okta, Azure AD) use the claim "scp" to enumerate scopes.
#  The claim MUST NOT be nested and MUST be a valid ECMAScript identifier.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_SCOPE_CLAIM=

#==============================================================================
# STIGMAN_JWT_SERVICENAME_CLAIM
#
#  | Default: "clientId" | The access token claim whose value is the user's
#  client. The claim MUST NOT be nested and MUST be a valid ECMAScript
#  identifier.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_SERVICENAME_CLAIM=

#==============================================================================
# STIGMAN_JWT_USERNAME_CLAIM
#
#  | Default: "preferred_username" | The access token claim whose value is the
#  user's username. The claim MUST NOT be nested and MUST be a valid ECMAScript
#  identifier.
#
#  Affects: API, Client
#==============================================================================
# export STIGMAN_JWT_USERNAME_CLAIM=

#==============================================================================
# STIGMAN_OIDC_PROVIDER
#
#  | Default: "http://localhost:8080/auth/realms/stigman" | The base URL of the
#  OIDC provider issuing signed JWTs for the API.  The string "/.well-
#  known/openid-configuration" will be appended when fetching metadata.
#
#  Affects: API, Client     
#==============================================================================
# export STIGMAN_OIDC_PROVIDER=

#==============================================================================
# STIGMAN_SWAGGER_ENABLED
#
#  | Default: "false" | Whether to enable the SwaggerUI SPA at /api-docs
#
#  Affects: API
#==============================================================================
# export STIGMAN_SWAGGER_ENABLED=

#==============================================================================
# STIGMAN_SWAGGER_OIDC_PROVIDER
#
#  | Default: Value of "STIGMAN_OIDC_PROVIDER" | SwaggerUI override of the base
#  URL of the OIDC provider issuing signed JWTs for the API.  The string
#  "/.well-known/openid-configuration" will be appended by the SwaggerUI when
#  fetching metadata.
#
#  Affects: API  
#==============================================================================
# export STIGMAN_SWAGGER_OIDC_PROVIDER=

#==============================================================================
# STIGMAN_SWAGGER_REDIRECT
#
#  | Default: "http://localhost:54000/api-docs/oauth2-redirect.html" | The
#  redirect URL sent by SwaggerUI to the OIDC provider when authorizing
#
#  Affects: API
#==============================================================================
# export STIGMAN_SWAGGER_REDIRECT=

#==============================================================================
# STIGMAN_SWAGGER_SERVER
#
#  | Default: "http://localhost:54000/api" | The API server URL relative to the
#  SwaggerUI
#
#  Affects: API
#==============================================================================
# export STIGMAN_SWAGGER_SERVER=

./stig-manager-linuxstatic
