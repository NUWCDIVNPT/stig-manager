# STIG Manager OSS Technical Information

STIG Manager has been developed and tested in a Docker container. It is recommended way to run, but not required. 

# Components 
### API
The STIG Manager API is a RESTful API using Node.js 12+ and the Express web application framework. Exposes 1 HTTP port. TLS support can be provided by a reverse proxy, such as nginx.

### Client
The STIG Manager Client is using the ExtJS 3.4 application framework under the GNU General Public License.

### Documentation
STIG Manager documentation can be found on [GitHub Pages.](https://nuwcdivnpt.github.io/stig-manager/) Currently using Docsify for documentation generation.


# Requirements
STIG Manager requires Node.js 12+, an authentication provider and a MySQL Database. Use the [Environment Variables](Environment_Variables.md) to specify your environment for STIG Manager.

### Runtime
STIG Manager is a Node.js web app. It has been tested both as a standalone Node.js web app and as part of a Docker container. For more information, and a sample orchestration, please see our [Docker Hub site.](https://hub.docker.com/r/carlsmig/stig-manager)

### Authentication - RedHat Keycloak 11+
The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User roles are extracted from token claims, endpoint access is controlled by token scope. 
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication. 

LINK TO KEYCLOAK DOCS

The following items in the Keycloak installation must be created and configured appropriately, and their values passed to STIG Manager in the appropriate Environment Variable: 
 * Keycloak Realm - `STIGMAN_CLIENT_KEYCLOAK_AUTH` suggested value: stigman
 * Client ID - `STIGMAN_CLIENT_KEYCLOAK_CLIENTID` suggested value: stig-manager

Required Keycloak settings:
 * Roles - Create the following roles:
   * admin
   * user
   * create_collection
   * global_access
 * Client Scopes - Create the following scopes, and assign them the specified roles:

| **Client Scopes**             | **Roles** | 
|-------------------------------|-----------|
| `stig-manager:collection`      | admin<br>user<br>create_collection<br>global_access          |
| `stig-manager:collection:read` | admin<br>user<br>create_collection<br>global_access          |
| `stig-manager:op`              | admin          |
| `stig-manager:op:read`         | admin          |
| `stig-manager:stig`            | admin          |
| `stig-manager:stig:read`       | admin<br>user<br>create_collection<br>global_access          |
| `stig-manager:user`            | admin<br>user<br>create_collection<br>global_access          |
| `stig-manager:user:read`       | admin<br>user<br>create_collection<br>global_access          |


 * 
 * Authorization Code Flow with PKCE (Called "Standard Flow" in Keycloak)
 * Valid Redirect URIs - The address at which your users will access STIG Manager
 * Create these roles for users: user, admin, collectionCreator


Other suggested Keycloak settings for the STIGMan realm:
  * Revoke refresh token: yes
  * Refresh Token Max Reuse: 0
  * Client or SSO Session Idle: 10 minutes
  * The "preferred_username" claim in the token should hold the username you intend to be used in STIG Manager (this is the default setting). If changed, use `STIGMAN_JWT_USER_CLAIM` to specify.

For other settings, the default Keycloak settings should work.

Most commonly, STIG Manager will require the below Environment Variable to be specified, unless their default values are appropriate.  Check the [Environment Variables](Environment_Variables.md) document for an exhaustive list of Environment Variables and their default values.
 * `STIGMAN_API_AUTHORITY` - Sample value: http://*keycloakAddress*:8080/auth/realms/stigman
 * `STIGMAN_CLIENT_KEYCLOAK_AUTH`  - Sample value: http://*keycloakAddress*:8080/auth
 * `STIGMAN_CLIENT_KEYCLOAK_REALM` - Sample value: stigman
 * `STIGMAN_CLIENT_KEYCLOAK_CLIENTID` - Sample value: stig-manager

A sample Keycloak image, recommended only for testing purposes, is available on our [Docker Hub site.](https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager-auth) Most of the default values for the above Environment variables will work with this image. 

### Add Users
Don't forget to add at least your first STIGMan user when configuring KeyCloak. You can also configure Keycloak to auto-enroll users. 
STIG Manager will automatically create it's own user associations for Collection grants once a KeyCloak authenticated user accesses the system. The privileges Admin, Collection Creator, and Global Access are managed in Keycloak with Roles. Specific Grants to Collections and Assets/STIGs are managed in the STIG Manager app.


### Database - MySQL 8.0.4+
STIG Manager has been tested with MySQL 8.0.21.

The API requires knowledge of 1) the DB address 2) which schema (database) is used for STIG Manager 3) User credentials with necessary privileges on that schema. The API includes a database migration function which tracks the schema version and if necessary can automatically update the schema at launch. The initial run of the API scaffolds all database objects and static data.

STIG Manager requires the use of an account with SuperUser privileges on the intended schema. (grant all on *stigman* schema to *stigman* user). 

Specify your MySQL DB with the following Environment Variables:
`STIGMAN_DB_HOST`
`STIGMAN_DB_PORT`
`STIGMAN_DB_USER`
`STIGMAN_DB_SCHEMA`
`STIGMAN_DB_PASSWORD`

TLS support
LINK TO MYSQL DOCS

`STIGMAN_DB_TLS_CA_FILE`
`STIGMAN_DB_TLS_CERT_FILE`
`STIGMAN_DB_TLS_KEY_FILE`

https://github.com/NUWCDIVNPT/stig-manager-docker-compose



### Default Super User

The first user in STIG Manager, which will be automatically created at first startup, and will have Administrator privileges in the app.
This user must be able to be authenticated by the Keycloak instance you reference at startup.
Specify the first STIG Manager user with the `STIGMAN_SUPERUSER` Environment Variable (default: admin):

### Adding Users

To add additional users to STIG Manager, they must be added both to Keycloak and STIG Manager. Add users to Keycloak using the Realm User Management screen. Administrators (initially just the super user referenced above), can add new users in STIG Manager via the Users Administration tab.

The user administration process is currently being refactored.

### First Steps
Import STIGs.
check admin quickstart guide

### Environment Variables

Check the [Environment Variables](Environment_Variables.md) document for an exhaustive list of Environment Variables and their default values.

## Container Information

For more information, and a sample orchestration, please see our [Docker Hub site.](https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager)

