
.. _Environment Variables:

Environment Variables
=========================

STIG Manager is configured via its Environment Variables:




.. list-table:: STIG Manager Environment Variables
   :widths: 20 70 10
   :header-rows: 1
   :class: tight-table

   * - Variable
     - Description
     - Affects
   * - STIGMAN_API_ADDRESS
     - **Default** ``0.0.0.0`` The IP address on which the the API server will listen 
     - API
   * - STIGMAN_API_AUTHORITY
     - **Deprecated** and will be removed soon. Use ``STIGMAN_OIDC_PROVIDER`` 
     - Deprecated
   * - STIGMAN_API_MAX_JSON_BODY
     - **Default** ``5242880``   The maximum size in bytes of the request body when Content-Type is application/json
     - API
   * - STIGMAN_API_MAX_UPLOAD
     - **Default** ``1073741824`` The maximum size in bytes of the file uploaded with Content-Type multipart/form-data
     - API
   * - STIGMAN_API_PORT
     - **Default** ``54000`` The TCP port on which the server will listen 
     - API
   * - STIGMAN_CLASSIFICATION
     - **Default** ``U`` Sets the classification banner, if any. Available values: ``NONE`` ``U`` ``FOUO`` ``C`` ``S`` ``TS`` ``SCI`` 
     - API, Client
   * - STIGMAN_CLIENT_API_BASE
     - **Default** ``./api`` The base URL for Client requests to the API relative to the sever root at / 
     - Client
   * - STIGMAN_CLIENT_DIRECTORY
     - **Default** ``./clients`` The location of the web client files, relative to the API source directory. Note that if running source from a clone of the GitHub repository, the client is located at `../../clients` relative to the API directory. 
     - API, Client
   * - STIGMAN_CLIENT_DISABLED
     - **Default** ``false`` Whether to *not* serve the reference web client
     - Client
   * - STIGMAN_CLIENT_EXTRA_SCOPES
     - **No default** OAuth2 scopes to request in addition to ``stig-manager:stig`` ``stig-manager:stig:read`` ``stig-manager:collection`` ``stig-manager:user`` ``stig-manager:user:read`` ``stig-manager:op``
     - Client
   * - STIGMAN_CLIENT_ID
     - **Default** ``stig-manager`` The OIDC clientId of the web client
     - Client
   * - STIGMAN_CLIENT_KEYCLOAK_AUTH
     - **Deprecated** and will be removed soon. Use ``STIGMAN_CLIENT_OIDC_PROVIDER``
     - Deprecated
   * - STIGMAN_CLIENT_KEYCLOAK_CLIENTID
     - **Deprecated** and will be removed soon. Use ``STIGMAN_CLIENT_ID`` 
     - Deprecated
   * - STIGMAN_CLIENT_KEYCLOAK_REALM
     - **Deprecated** and will be removed soon. Use ``STIGMAN_CLIENT_OIDC_PROVIDER`` 
     - Deprecated
   * - STIGMAN_CLIENT_OIDC_PROVIDER
     - **Default** Value of ``STIGMAN_OIDC_PROVIDER`` Client override of the base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended by the client when fetching metadata.
     - Client 
   * - STIGMAN_CLIENT_REFRESH_DISABLED
     - **Default** ``false`` Whether the web client should expect the OIDC provider to *not* issue an OAuth2 refresh token
     - Client 
   * - STIGMAN_DB_HOST
     - **Default** ``localhost`` The database hostname or IP from to the API server
     - API
   * - STIGMAN_DB_MAX_CONNECTIONS
     - **Default** ``25`` The maximum size of the database connection pool 
     - API
   * - STIGMAN_DB_PASSWORD
     - **No default** The password used to login to the database 
     - API
   * - STIGMAN_DB_PORT
     - **Default** ``3306`` The database TCP port relative to the API server
     - API          
   * - STIGMAN_DB_SCHEMA
     - **Default** ``stigman`` The schema where the STIG Manager object are found
     - API          
   * - STIGMAN_DB_TLS_CA_FILE
     - **No default** A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database.
     - API          
   * - STIGMAN_DB_TLS_CERT_FILE
     - **No default** A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client. Additionally requires setting values for ``STIGMAN_DB_TLS_CA_FILE`` and ``STIGMAN_DB_TLS_KEY_FILE``. 
     - API          
   * - STIGMAN_DB_TLS_KEY_FILE
     - **No default** A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client. Additionally requires setting values for ``STIGMAN_DB_TLS_CA_FILE`` and ``STIGMAN_DB_TLS_CERT_FILE``.
     - API          
   * - STIGMAN_DB_TYPE
     - **Default** ``mysql`` The database type. Valid values are ``mysql`` 
     - API          
   * - STIGMAN_DB_USER
     - **Default** ``stigman`` The user account used to login to the database 
     - API    
   * - STIGMAN_DOCS_DIRECTORY
     - **Default** ``./docs`` The location of the documentation files, relative to the API source directory. Note that if running source from a clone of the GitHub repository, the docs are located at `../../docs/_build/html` relative to the API directory. 
     - API, documentation
   * - STIGMAN_DOCS_DISABLED
     - **Default** ``false`` Whether to *not* serve the project Documentation.  NOTE: If you choose to serve the Client from the API container but not the Documentation, the links do the Docs on the home page will not work. 
     - Documentation                
   * - STIGMAN_INIT_IMPORT_STIGS
     - **Default** ``false`` Whether to fetch and import the current DISA STIG Library compilation from public.cyber.mil on initial database migration 
     - API          
   * - STIGMAN_INIT_IMPORT_SCAP
     - **Default** ``false`` Whether to fetch and import current DISA SCAP content from public.cyber.mil on initial database migration
     - API          
   * - STIGMAN_JWT_EMAIL_CLAIM
     - **Default** ``email`` The access token claim whose value is the user's email address
     - API, Client
   * - STIGMAN_JWT_NAME_CLAIM
     - **Default** ``name`` The access token claim whose value is the user's full name
     - API, Client
   * - STIGMAN_JWT_PRIVILEGES_CLAIM
     - **Default** ``realm_access.roles`` The access token claim whose value is the user’s privileges 
     - API, Client
   * - STIGMAN_JWT_ROLES_CLAIM
     - **Deprecated** and will be removed soon. Use ``STIGMAN_JWT_PRIVILEGES_CLAIM`` 
     - Deprecated
   * - STIGMAN_JWT_SERVICENAME_CLAIM
     - **Default** ``clientId`` The access token claim whose value is the user's client
     - API, Client
   * - STIGMAN_JWT_USERNAME_CLAIM
     - **Default** ``preferred_username`` The access token claim whose value is the user's username
     - API, Client
   * - STIGMAN_OIDC_PROVIDER
     - **Default** ``http://localhost:8080/auth/realms/stigman``  The base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended when fetching metadata.
     - API, Client
   * - STIGMAN_SWAGGER_AUTHORITY
     - **Deprecated** and will be removed soon. Use STIGMAN_SWAGGER_OIDC_PROVIDER 
     - Deprecated
   * - STIGMAN_SWAGGER_ENABLED
     - **Default** ``false`` Whether to enable the SwaggerUI SPA at /api-docs 
     - API
   * - STIGMAN_SWAGGER_OIDC_PROVIDER
     - **Default** Value of ``STIGMAN_OIDC_PROVIDER`` SwaggerUI override of the base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended by the SwaggerUI when fetching metadata.
     - API  
   * - STIGMAN_SWAGGER_REDIRECT
     - **Default** ``http://localhost:54000/api-docs/oauth2-redirect.html`` The redirect URL sent by SwaggerUI to the OIDC provider when authorizing
     - API
   * - STIGMAN_SWAGGER_SERVER
     - **Default** ``http://localhost:54000/api`` The API server URL relative to the SwaggerUI 
     - API
 

|

|


.. list-table:: Useful Node.js Environment Variables
   :widths: 20 70 10
   :header-rows: 1
   :class: tight-table

   * - Variable
     - Description
     - Affects
   * - NODE_EXTRA_CA_CERTS
     - **[your CA certificate file path]**  Set this Node.js environment variable to direct Node to accept CA certificates you have provided, in addition to its built-in CA certs. In the case of the Iron Bank based image, DoD CA certificates are already located here: ``/etc/pki/ca-trust/source/anchors/Certificates_PKCS7_v5.7_DoD.pem``
     - Node.js, API

