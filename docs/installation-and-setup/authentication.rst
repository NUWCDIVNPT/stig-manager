.. _authentication:


Authentication and Identity
########################################

The API requires an OAuth2 JSON Web Token (JWT) that conforms to the OpenID Connect specification to determine client and user access. The STIG Manager OSS Project suggests the use of the **Authorization Code Flow with Proof Key for Code Exchange** (PKCE)​ flavor of OAuth 2.0​ for use with the project web application.  To support users that wish to develop their own utilities, we also suggest enabling the Device Authorization Grant Flow.

STIG Manager OSS has been tested to work with Keycloak, Okta, and AzureAD as OIDC providers.  It is expected to work with other OIDC providers if they can be configured to provide a token that meets the requirements specified below. Please create an Issue with details on our GitHub project if you experience issues with other providers.

.. note::
  If you are using the demonstration Keycloak container from the Project's Docker Hub page, you may not need to change any settings or variables described in this section. 


.. _jwt_requirements:

JSON Web Token (JWT) Requirements
----------------------------------

The JWT produced by the Identity Provider should provide the claims specified below. Some of them may have different names in your configuration, and can be specified in STIGMan's environment variables if they differ from the default values:
    
    * Username - ``STIGMAN_JWT_USERNAME_CLAIM`` - **default:** ``preferred_username``
    * User Full Name - ``STIGMAN_JWT_NAME_CLAIM`` - (optional) **default:** ``name``
    * User Email - ``STIGMAN_JWT_EMAIL_CLAIM`` - (optional) **default:** ``email``
    * User Privileges - ``STIGMAN_JWT_PRIVILEGES_CLAIM`` - **default:** ``realm_access.roles``
    * Scope - ``STIGMAN_JWT_SCOPE_CLAIM`` **default:** ``scope``. Some OIDC Providers (Okta, Azure Entra ID) use the claim ``scp`` to enumerate scopes. May name more than one claim, as a comma-separated list such as ``scp,roles``, in which case the scopes found in each named claim are combined. See :ref:`service-account-setup`.
    * Assertion ID - ``STIGMAN_JWT_ASSERTION_CLAIM`` **default** ``jti``. Some OIDC Providers (ADFS, Azure Entra ID?) use the claim ``uti`` instead of ``jti`` to protect against replay attacks.
    * Service Name - ``STIGMAN_JWT_SERVICENAME_CLAIM`` - **default:** ``clientId``. Used for service account clients.
    * Audience - ``STIGMAN_JWT_AUD_VALUE`` - (optional) **no default**. If specified, the ``aud`` claim must include this value.

.. important::
   **Claim Value Formats**

   The token values found at each claim location must use the following formats:

   * **Username**, **Name**, **Email**, **Assertion ID**, **Service Name**: String
   * **Scope**: A space-separated string per OAuth 2.0 RFC 6749 (e.g., ``"openid stig-manager:collection stig-manager:stig:read"``), or an array of strings with one scope per element (e.g., ``["stig-manager:collection", "stig-manager:stig:read"]``). Array elements are not split on spaces. When ``STIGMAN_JWT_SCOPE_CLAIM`` names more than one claim, each claim is read independently and may use either format.
   * **Privileges**: An array of strings (e.g., ``["admin", "create_collection"]``) or ``null``. 
   * **Audience**: String or array of strings. If ``STIGMAN_JWT_AUD_VALUE`` is set, it must be present in the ``aud`` claim value.

.. note::
  STIG Manager will use the value specified in the ``STIGMAN_JWT_USERNAME_CLAIM`` environment variable as the Claim that should hold a users unique username. This value defaults to the Keycloak default, which is ``preferred_username``


.. code-block:: JSON
   :caption: The decoded data payload of a sample JWT, with some relevant claims highlighted.
   :name: A Decoded JWT
   :emphasize-lines: 18,19,20,40,42

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
          "admin",
          "user"
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
      "preferred_username": "Jane Stigsdottir"
    }


The fields highlighted in the sample token above control the access and information STIG Manager requires to allow users to access the application.  The token your OIDC provider creates does not need to look exactly like this, but where it differs the relevant claims must be specified using STIG Manager Environment Variables. 


Cross-Origin Resource Sharing (CORS)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your deployment environment has your OIDC Provider and the STIGMan Client in different origins (ie. domains), you will need to specify the Client origin in the Web Origins configuration options of your OIDC Provider. This will set the ``Access-Control-Allow-Origin`` header in the OIDC Provider's responses, and permit browsers to make subsequent requests to the OIDC provider.  

Alternatively, you could situate your OIDC Provider and the Client server behind a reverse proxy that is configured to present them both as coming from the same origin, avoiding the problem. 



.. _service-account-setup:

Service Account Client Setup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are using a service account to connect to the STIGMan API, the ``STIGMAN_JWT_SERVICENAME_CLAIM`` Environment Variable must specify the claim that will hold the client ID. The default is ``clientId``. There may be other OIDC Provider configuration required. 

Some OIDC Providers convey a service account's permissions in a different claim than they use for interactive users. Azure Entra ID is one: a token issued for a signed-in user carries delegated permissions in the ``scp`` claim, as a space-separated string, while a token issued through the client credentials flow carries the application's own permissions in the ``roles`` claim, as an array of strings, and has no ``scp`` claim. Either claim may be absent entirely — an application with no app roles assigned receives no ``roles`` claim.

To accept both kinds of token, name both claims::

    STIGMAN_JWT_SCOPE_CLAIM=scp,roles

STIG Manager combines the scopes found in each claim, so one deployment can serve interactive users and service accounts at the same time. Naming several claims is not specific to Entra ID and may be used with any provider that splits scopes across claims.

To grant an Entra ID service account access:

1. In the API's app registration, define app roles whose **value** is a STIG Manager scope, such as ``stig-manager:collection``. Allowed member types must include **Application**. App role values may contain colons and must not contain spaces, so STIG Manager's scope strings are valid role values. Entra emits them bare, without the ``api://`` prefix.
2. Assign those app roles to the calling application and grant admin consent.
3. Have the client request the scope ``api://<application-id>/.default``. The client credentials flow does not accept individual scopes.
4. Set ``STIGMAN_JWT_AUD_VALUE`` to the API's client ID, since v2 tokens use it as the audience.

.. note::
   On Entra ID the ``roles`` claim also carries a *user's* assigned app roles. Naming ``roles`` therefore combines any app roles assigned to a user into that user's scope set. Values that are not STIG Manager scopes cannot match a required scope and are ignored. Privileges remain a separate setting, read from ``STIGMAN_JWT_PRIVILEGES_CLAIM``.

.. note::
   An Entra ID administrator may alternatively emit a fixed scope string into a custom claim using a claims mapping policy, and point ``STIGMAN_JWT_SCOPE_CLAIM`` at it. This requires no change to STIG Manager, but the value is a constant attached to the API, so every caller receives the same scopes and per-user consent no longer governs the scope set. It also requires either ``acceptMappedClaims`` in the application manifest, which needs a verified-domain Application ID URI and is single-tenant only, or a custom signing key. Assigning app roles as described above is preferred.


.. _oidc-scopes:

Scopes, and Privileges
---------------------------------

The STIG Manager API restricts endpoint access using the "scope" claims in the JWT. See the `API specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ for details. 

The guide provided below maps scopes to various Realm Roles that are then assigned to Users. 
These Roles and Scopes can be provided to users in various ways, using Client Roles, Client Groups, defaults, etc. Please refer to the `Keycloak Documentation <https://www.keycloak.org/documentation>`_ for more information. 

The **Roles** specified in the JWT map to Privileges in STIG Manager that allow varying levels of access and abilities. See the :ref:`user-roles-privs` section of the Setup Guide for more information. 

The **Scopes** specified in the JWT control access to API endpoints as specified in the OpenAPI spec.  See the :ref:`STIG Manager Client Scopes and Roles <oidc-scopes-table>` table below for a suggestion on how to allocate these scopes using OIDC roles, and more information. 

If your OIDC Provider requires the STIG Manager Web App to request additional scopes when redirecting to the OIDC Provider, you can provide those as values to the envvar ``STIGMAN_CLIENT_EXTRA_SCOPES``. An example would be Okta, which requires the scope ``offline_access`` be requested in order to generate a refresh token.

.. _keycloak:

Authentication Example - RedHat Keycloak 19
-------------------------------------------------------

.. note::
  The Keycloak project updates frequently, and may introduce changes that will make this guide incompatible with later versions. The information provided below is just one way to configure Keycloak 19 to provide a JWT that will work with STIG Manager. Please make sure you configure Keycloak in accordance with your organization's Security Policy.

The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User privileges are extracted from token claims and endpoint access is controlled by token scope. 
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication. 
`More information about RedHat Keycloak. <https://www.keycloak.org/documentation>`_

A sample Docker-compose orchestration, using a Keycloak image configured as specified below and containing Demo users, can be found `on our Docker Hub page. <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_

Keycloak 19 Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The configuration offered below is just one way to create a Keycloak Realm that will authenticate Users for the STIGMan API and Client. The following items in the Keycloak installation must be created and configured appropriately, and their values passed to STIG Manager in the appropriate Environment Variable: 

* Keycloak Realm - suggested value: stigman
* Client ID - suggested value: stig-manager

Keycloak settings for the "stigman" realm:

* Configure->Roles->Realm Roles - Add the following roles:

  * user
  * create_collection
  * admin

.. note::
  These roles can also be set up at the Client level, rather than the Realm level. Make adjustments accordingly.

* Configure->Roles->Default Roles - Recommended: set "user" and "create_collection" as default roles.   
* Configure->Client Scopes - Create the following scopes, and assign them the specified roles in that scope's "Scope" tab (Role assignment only required if using Roles to assign scopes, rather than setting them as Default Client Scopes): 

.. _oidc-scopes-table:


  .. list-table:: STIG Manager Client Scopes and Roles: 
   :widths: 20 70
   :header-rows: 1
   :class: tight-table

   * - Client Scopes
     - Roles
   * - stig-manager:collection
     - user, admin
   * - stig-manager:collection:read
     - user
   * - stig-manager:op
     - admin
   * - stig-manager:op:read
     - user
   * - stig-manager:stig
     - admin
   * - stig-manager:stig:read
     - user
   * - stig-manager:user
     - user, admin 
   * - stig-manager:user:read
     - user
   * - stig-manager
     - Alternative catch-all scope for all roles above.

* Configure->Clients->stig-manager:

  * Settings:

    * Enable Authorization Code Flow with PKCE (Called "Standard Flow" in Keycloak)
    * Valid Redirect URIs - The URI at which your users will access STIG Manager
    * Web Origins - Configure according to Organizational requirements. Often the same as the Valid Redirect URIs

  * Client Scopes:

    * Add the scopes created above as either Assigned Optional Client Scopes or Default Client Scopes.


Other suggested Keycloak settings for the stig-manager client:

  * Revoke refresh token: yes
  * Refresh Token Max Reuse: 0
  * Client or SSO Session Idle: 10 minutes
  * The "preferred_username" claim in the token should hold the username you intend to be used in STIG Manager (this is the default setting). If changed, use ``STIGMAN_JWT_USER_CLAIM`` to specify.
  * Set "OAuth 2.0 Device Authorization Grant Enabled" to "On."

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

.. _stigman_client_reauth_action:

``STIGMAN_CLIENT_REAUTH_ACTION``
-------------------------------------------------------

The ``STIGMAN_CLIENT_REAUTH_ACTION`` environment variable controls how the STIG Manager web application responds when a user's credentials have expired and re-authentication is required. This setting determines **where** and **how** the OIDC (OpenID Connect) authorization flow is initiated for the user.

Possible Values
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**popup** (default)  
    Opens the OIDC authorization endpoint in a new browser popup window.

**iframe**  
    Opens the OIDC authorization endpoint in an embedded iframe within the app.

**tab**  
    Opens the OIDC authorization endpoint in a new browser tab.

**reload**  
    Reloads the current application tab, which will trigger the authentication redirect.

Comparison Table
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table:: STIGMAN_CLIENT_REAUTH_ACTION Options
   :widths: 10 10 30 30
   :header-rows: 1
   :class: tight-table


   * - Action
     - UX
     - Upsides
     - Downsides
   * - **popup**
     - Good
     - - Keeps the main application context intact. User can complete authentication without reloading the main app.
       - Permitted natively by browsers, since the popup is opened by a user action.
     - May be blocked by third-party browser popup blockers, requiring user intervention.  
   * - **iframe**
     - Best
     - - No new browser windows or tabs, the main application remains loaded and visible.
     - The OIDC Provider must allow being embedded in an iframe by setting an appropriate ``frame_ancestors`` directive in the Content-Security-Policy (CSP) header. See `frame_ancestors documentation on MDN <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors>`_ 🔗
   * - **tab**
     - Acceptable  
     - - Less likely to be blocked by third-party popup blockers compared to popups.
       - Main application remains open in the original tab.
     - User will be switched back to the original tab after authentication, which can be confusing if multiple tabs are open.
   * - **reload**
     - Poor
     - - Compatible with all browsers and OIDC providers.  
       - No issues with popup blockers or CSP.
     - The application state is lost; any unsaved work will be discarded.  

