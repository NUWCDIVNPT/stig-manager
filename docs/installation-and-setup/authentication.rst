.. _authentication:


Authentication and Identity
########################################


The API requires an OAuth2 JSON Web Token (JWT) to determine client and user access.  
- The provided client requires Keycloak to authorize the user and generate this token, but this requirement will be removed in a future release. At that point any OAuth2 Identity provider will be able to be used, as long as the JWT it produces can be configured appropriately.

JSON Web Token Requirements
----------------------------------

The JWT produced by the Identity Provider should provide the following claims, which can be specified in STIGMan's environment variables if they differ from default values:
    
    * Username - ``STIGMAN_JWT_USERNAME_CLAIM`` - default ``preferred_username``
    * User Roles - ``STIGMAN_JWT_ROLES_CLAIM`` - ``realm_access.roles``
    * User Full Name - ``STIGMAN_JWT_NAME_CLAIM`` - (optional)``name``
    * User Email - ``STIGMAN_JWT_EMAIL_CLAIM`` - (optional) ``email``

.. note::
  STIG Manager will use the value specified in the ``STIGMAN_JWT_USERNAME_CLAIM`` environment variable as the Claim that should hold a users unique username. This value defaults to the Keycloak default, which is ``preferred_username``

If you are using a service account to connect to the STIGMan API, the ``STIGMAN_JWT_SERVICENAME_CLAIM`` Environment Variable must specify the claim that will hold the client ID. The default is ``clientId``. There may be other Keycloak configuration required. 


Roles, Scopes, and Privileges
---------------------------------

The STIG Manager API restricts endpoint access using the "scope" claims in the JWT. See the `API specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ for details. 

The guide provided below maps scopes to various Realm Roles that are then assigned to Users. 
These Roles and Scopes can be provided to users in various ways, using Client Roles, Client Groups, defaults, etc. Please refer to the `Keycloak Documentation <https://www.keycloak.org/documentation>`_ for more information. 

The Roles specified in the JWT map to Privileges in STIG Manager that allow varying levels of access and abilities. See the :ref:`user-roles-privs` section of the Setup Guide for more information. 


.. _keycloak:

Authentication - RedHat Keycloak 11+
---------------------------------------

The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User roles are extracted from token claims, endpoint access is controlled by token scope. 
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication. 
`More information about RedHat Keycloak. <https://www.keycloak.org/documentation>`_

A sample Keycloak Realm import file, configured as specified below and containing no users, can be found `in our github repo. <https://github.com/NUWCDIVNPT/stig-manager/tree/main/docker/keycloak>`_

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

  .. list-table:: STIG Manager Client Scopes and Roles: 
   :widths: 20 70
   :header-rows: 1
   :class: tight-table

   * - Client Scopes
     - Roles
   * - stig-manager:collection
     - user   
   * - stig-manager:collection:read
     - user
   * - stig-manager:op
     - admin
   * - stig-manager:op:read
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

 * *STIGMAN_API_AUTHORITY* - Sample value:  http://*keycloakAddress*:8080/auth/realms/stigman
 * *STIGMAN_CLIENT_KEYCLOAK_AUTH*  - Sample value:  http://*keycloakAddress*:8080/auth
 * *STIGMAN_CLIENT_KEYCLOAK_REALM* - Suggested value: stigman
 * *STIGMAN_CLIENT_KEYCLOAK_CLIENTID* - Suggested value: stig-manager

A sample Keycloak image, recommended only for testing purposes, is available on `Docker Hub. <https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager-auth>`_ Most of the default values for the above Environment variables will work with this image. 

