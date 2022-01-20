.. _authentication:


Authentication and Identity
########################################

The API requires an OAuth2 JSON Web Token (JWT) that conforms to the OpenID Connect specification to determine client and user access. The STIG Manager OSS Project implements the the **Authorization Code Flow with Proof Key for Code Exchange** (PKCE)​ flavor of OAuth 2.0​.

STIG Manager OSS has been tested to work with Keycloak and Okta as OIDC providers.  It is expected to work with other OIDC providers if they can be configured to provide a token that meets the requirements specified below. Please create an Issue with details on our GitHub project if you experience issues with other providers.

.. note::
  If you are using the demonstration Keycloak container from the Project's Docker Hub page, you may not need to change any settings or variables described in this section.  However, you should not use this pre-configured image in a Production environment. 


JSON Web Token (JWT) Requirements
----------------------------------

The JWT produced by the Identity Provider should provide the claims specified below. Some of them may have different names in your configuration. They can be specified with STIGMan's environment variables if they differ from the default values:
    
    * Username - ``STIGMAN_JWT_USERNAME_CLAIM`` - **default:** ``preferred_username``
    * User Full Name - ``STIGMAN_JWT_NAME_CLAIM`` - (optional) **default:** ``name``
    * User Email - ``STIGMAN_JWT_EMAIL_CLAIM`` - (optional) **default:** ``email``
    * User Privileges - ``STIGMAN_JWT_PRIVILEGES_CLAIM`` - **default:** ``realm_access.roles``
    * scope - OIDC standard. Use ``STIGMAN_CLIENT_EXTRA_SCOPES`` to specify additional scopes the client should request. 

.. note::
  STIG Manager will use the value specified in the ``STIGMAN_JWT_USERNAME_CLAIM`` environment variable as the Claim that holds a user's unique username. This value defaults to the Keycloak default, which is ``preferred_username``


.. code-block:: JSON
   :caption: The decoded data payload of a sample JWT, with some relevant claims highlighted.
   :name: A Decoded JWT
   :emphasize-lines: 18,19,20,21,39,41

    {
      "exp": 1695154418,
      "iat": 1630360166,
      "auth_time": 1630354418,
      "jti": "5b17970e-428a-4b54-a0bd-7ed29a436803",
      "iss": "http://localhost:8080/auth/realms/stigman",
      "aud": [
        "realm-management",
        "account"
      ],
      "sub": "eb965d15-aa78-43fc-a2a6-3d86258c1eec",
      "typ": "Bearer",
      "azp": "stig-manager",
      "nonce": "2a6a0726-6795-47f5-88a6-00eb8aed9e23",
      "session_state": "dca9233f-3d5b-4237-9e6e-be52d90cebdc",
      "acr": "0",
      "realm_access": {
        "roles": [
          "create_collection",
          "admin"
        ]
      },
      "resource_access": {
        "realm-management": {
          "roles": [
            "view-users",
            "query-groups",
            "query-users"
          ]
        },
        "account": {
          "roles": [
            "manage-account",
            "manage-account-links",
            "view-profile"
          ]
        }
      },
      "scope": "openid stig-manager:collection stig-manager:stig:read stig-manager:user:read stig-manager:op stig-manager:user stig-manager:stig",
      "email_verified": false,
      "preferred_username": "Jane_Stigsdottir"
    }


The fields highlighted in the sample token above specify information STIG Manager requires to allow users to access the application.  The token your OIDC provider creates does not need to look exactly like this, but where it differs the relevant claims must be specified using STIG Manager Environment Variables. 


Cross-Origin Resource Sharing (CORS)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your deployment environment has your OIDC Provider and the STIGMan Client in different origins (ie. domains), you will need to specify the Client origin in the Web Origins configuration options of your OIDC Provider. This will set the ``Access-Control-Allow-Origin`` header in the OIDC Provider's responses, and permit browsers to make subsequent requests to the OIDC provider.  

Alternatively, you could situate your OIDC Provider and the Client server behind a reverse proxy that is configured to present them both as coming from the same origin, avoiding the problem. 


Service Account Client Setup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are using a service account to connect to the STIGMan API, the ``STIGMAN_JWT_SERVICENAME_CLAIM`` Environment Variable must specify the claim that will hold the client ID. The default is ``clientId``. There may be other Keycloak configuration required. 


.. _oidc-scopes:

Scopes, and Privileges
---------------------------------

The **Scopes** specified in the scope claim of the JWT control overall access to API endpoints as specified in the `OpenAPI specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ .   In order for the web client provided with the Project to function as documented, STIG Manager Users and 
"admins" (Application Managers) should have the scopes listed here. 


Users without the "admin" privilege should get the following scopes in the generated OIDC token:
  - stig-manager:collection
  - stig-manager:stig:read
  - stig-manager:user:read
 
Users with the ``admin`` privilege must include these scopes in the generated OIDC token:
  - stig-manager:collection
  - stig-manager:op
  - stig-manager:stig
  - stig-manager:user

Users with the `create_collection` privilege do not require any additional scopes.

The privileges specified in the ``STIGMAN_JWT_PRIVILEGES_CLAIM`` claim in the JWT map to Privileges in STIG Manager that allow different levels of access and abilities to manipulate STIGMan data. 

.. list-table:: STIG Manager Privileges, associated user role names, and Abilities (assumes a valid token has been granted by the OIDC provider): 
  :widths: 20 20 60
  :header-rows: 1
  :class: tight-table

  * - User Privilege
    - Informal User Role Name
    - Abilities
  * - admin
    - "Application Manager"
    - Access STIG Manager; Can Manage Collections, Import STIGs, Manage Users, Import/Export App data
  * - create_collection
    - "Collection Creator"
    - Access STIG Manager; Can create their own Collections
  * - No explicit privileges
    - "User"
    - Access STIG Manager

.. _keycloak:

Authentication - RedHat Keycloak 11+
---------------------------------------

The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User roles are extracted from token claims, endpoint access is controlled by token scope. 
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication. 
`More information about RedHat Keycloak. <https://www.keycloak.org/documentation>`_

A sample Docker-compose orchestration, using a Keycloak image configured as specified below and containing Demo users, can be found `on our Docker Hub page. <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_

The guide provided below maps scopes to various Realm Roles that are then assigned to Users. 
These Roles and Scopes can be provided to users in various ways, using Client Roles, Client Groups, defaults, etc. Please refer to the `Keycloak Documentation <https://www.keycloak.org/documentation>`_ for more information. 

.. warning::
  The information provided below is just one way to configure Keycloak to provide a JWT that will work with STIG Manager. Please make sure you configure your chosen Authentication Provider in accordance with your organization's Security Policy.

Keycloak Configuration
~~~~~~~~~~~~~~~~~~~~~~~~

The following items in the Keycloak installation must be created and configured appropriately, and their values passed to STIG Manager in the appropriate Environment Variable: 

* Keycloak Realm - suggested value: stigman
* Client ID - suggested value: stig-manager

Required Keycloak settings for the "stigman" realm:

* Configure->Roles->Realm Roles - Add the following roles:

  * user
  * create_collection
  * admin

.. note::
  These roles can also be set up at the Client level, rather than the Realm level. Make adjustments accordingly.

* Configure->Roles->Default Roles - Recommended: set "user" and "create_collection" as default roles.   
* Configure->Client Scopes - Create the following scopes, and assign them the specified roles in that scope's "Scope" tab: 

.. _oidc-scopes-table:


  .. list-table:: STIG Manager Client Scopes and Roles: 
   :widths: 20 70
   :header-rows: 1
   :class: tight-table

   * - Client Scopes
     - Roles
   * - stig-manager:collection
     - user   
   * - stig-manager:op
     - admin
   * - stig-manager:stig
     - admin
   * - stig-manager:stig:read
     - user
   * - stig-manager:user
     - admin 
   * - stig-manager:user:read
     - user

* Configure->Clients->stig-manager:

  * Settings:

    * Enable Authorization Code Flow with PKCE (Called "Standard Flow" in Keycloak)
    * Valid Redirect URIs - The URI at which your users will access STIG Manager
    * Web Origins - Configure according to Organizational requirements.

  * Client Scopes:

    * Add the scopes created above as Assigned Optional Client Scopes.


Other suggested Keycloak settings for the stig-manager client:

  * Revoke refresh token: yes
  * Refresh Token Max Reuse: 0
  * Client or SSO Session Idle: 10 minutes
  * The "preferred_username" claim in the token should hold the username you intend to be used in STIG Manager (this is the default setting). If changed, use `STIGMAN_JWT_USER_CLAIM` to specify.

For other settings, the default Keycloak settings should work.

Configure STIG Manager to use your Authentication provider
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Most commonly, STIG Manager will require the below Environment Variable to be specified, unless their default values are appropriate.  Check the :ref:`Environment Variables` document for an exhaustive list of Environment Variables and their default values.

 * ``STIGMAN_OIDC_PROVIDER`` - Sample value:  ``http://localhost:8080/auth/realms/stigman`` - The base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended when fetching metadata.
 * ``STIGMAN_CLIENT_OIDC_PROVIDER``  - Default value: Value of ``STIGMAN_OIDC_PROVIDER`` - Client override of the base URL of the OIDC provider issuing signed JWTs for the API.  The string ``/.well-known/openid-configuration`` will be appended by the client when fetching metadata.
 * ``STIGMAN_CLIENT_KEYCLOAK_CLIENTID`` - Suggested value: ``stig-manager``
 * ``STIGMAN_JWT_PRIVILEGES_CLAIM`` - Sample value: ``realm_access.roles``
 * ``STIGMAN_CLIENT_EXTRA_SCOPES`` - Sample value: ``offline_access`` 


A sample Keycloak image, recommended only for testing purposes, is available on `Docker Hub. <https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager-auth>`_ Most of the default values for the above Environment variables will work with this image. 

