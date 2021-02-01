# STIG Manager OSS Setup and Technical Information

STIG Manager has been developed and tested in a Docker container. It is the recommended way to run, but not required. 

# Components 
### API
The STIG Manager API is a RESTful API using Node.js 14+ and the Express web application framework. Exposes 1 HTTP port. TLS support can be provided by a reverse proxy, such as nginx.

### Client
The STIG Manager Client is using the ExtJS 3.4 application framework under the GNU General Public License.

### Documentation
STIG Manager documentation can be found on [GitHub Pages.](https://nuwcdivnpt.github.io/stig-manager/) Currently using Docsify for documentation generation.


# Requirements
STIG Manager requires Node.js 14+, an authentication provider and a MySQL Database. Use the [Environment Variables](Environment_Variables.md) to specify your environment for STIG Manager.

## Runtime
STIG Manager is a Node.js web app. It has been tested both as a standalone Node.js web app and as part of a Docker container. For more information, and a sample orchestration, please see our [Docker Hub site.](https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager)

## Authentication - RedHat Keycloak 11+
The web client is an OpenID Connect (OIDC) OAuth2 Relying Party and the API is an OAuth2 Resource Server. User authentication is provided by an external Identity Provider (IdP). All API access is controlled by OAUth2 JSON Web Tokens (JWTs) issued by the IdP. User roles are extracted from token claims, endpoint access is controlled by token scope. 
Keycloak is readily available, actively maintained by a major OSS vendor, supports Identity Brokering and User Federation, and is used by major DoD projects such as Air Force Iron Bank.
Keycloak supports many External Identity Providers, but has only been tested using its own authentication. 
[More information about RedHat Keycloak.](https://www.keycloak.org/documentation)

A sample Keycloak Realm import file, configured as specified below and containing no users, can be found in our github repo.

### Keycloak Configuration
The following items in the Keycloak installation must be created and configured appropriately, and their values passed to STIG Manager in the appropriate Environment Variable: 
 * Keycloak Realm - suggested value: stigman
 * Client ID - suggested value: stig-manager

Required Keycloak settings for the "stigman" realm:
 * Configure->Roles->Realm Roles - Add the following roles:
   * user
   * create_collection
   * admin
   * global_access
 * Configure->Roles->Default Roles - Recommended: set "user" and "create_collection" as default roles.   
 * Configure->Client Scopes - Create the following scopes, and assign them the specified roles in that scope's "Scope" tab: 
  | **Client Scopes**             | **Roles** | 
  |-------------------------------|-----------|
  | `stig-manager:collection`      | admin, user, create_collection, global_access          |
  | `stig-manager:collection:read` | admin, user, create_collection, global_access          |
  | `stig-manager:op`              | admin          |
  | `stig-manager:op:read`         | admin          |
  | `stig-manager:stig`            | admin          |
  | `stig-manager:stig:read`       | admin, user, create_collection, global_access          |
  | `stig-manager:user`            | admin, user, create_collection, global_access          |
  | `stig-manager:user:read`       | admin, user, create_collection, global_access          |


 * Configure->Clients->stig-manager:
   * Settings:
     * Enable Authorization Code Flow with PKCE (Called "Standard Flow" in Keycloak)
     * Valid Redirect URIs - The address at which your users will access STIG Manager
     * Web Origins - 
   * Client Scopes:
     * Add the scopes created above as Assigned Optional Client Scopes.


Other suggested Keycloak settings for the stig-manager client:
  * Revoke refresh token: yes
  * Refresh Token Max Reuse: 0
  * Client or SSO Session Idle: 10 minutes
  * The "preferred_username" claim in the token should hold the username you intend to be used in STIG Manager (this is the default setting). If changed, use `STIGMAN_JWT_USER_CLAIM` to specify.

For other settings, the default Keycloak settings should work.

### Configure STIG Manager to use your Authentication provider
Most commonly, STIG Manager will require the below Environment Variable to be specified, unless their default values are appropriate.  Check the [Environment Variables](Environment_Variables.md) document for an exhaustive list of Environment Variables and their default values.
 * `STIGMAN_API_AUTHORITY` - Sample value: http://*keycloakAddress*:8080/auth/realms/stigman
 * `STIGMAN_CLIENT_KEYCLOAK_AUTH`  - Sample value: http://*keycloakAddress*:8080/auth
 * `STIGMAN_CLIENT_KEYCLOAK_REALM` - Suggested value: stigman
 * `STIGMAN_CLIENT_KEYCLOAK_CLIENTID` - Suggested value: stig-manager

A sample Keycloak image, recommended only for testing purposes, is available on our [Docker Hub site.](https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager-auth) Most of the default values for the above Environment variables will work with this image. 

### Add Users
Add at least your first STIGMan Administrator user when setting up KeyCloak for the first time. You can also configure Keycloak to auto-enroll users, but that is beyond the scope of this document. 
Add users via the Manage->Users interface for the realm you have created. Assign them roles using the "Role Mappings" tab for that user.

  | **User Type**             | **Keycloak Roles** | 
  |-------------------------------|-----------|
  | Administrator      | user, admin          |
  | Collection Creator User              | user, create_collection          |
  | Restricted User | user          |  
  | Global Access User         | user, global_access          |

It is recommended that most users should be "Collection Creator Users"(ie. assigned the "user" and "create_collection" roles). As mentioned above, you can set these roles as defaults using the Configure->Roles->Default Roles interface. A Restricted User will only have access to grants they have been assigned by other users. Collection Creator Users can create and manage their own collections, as well as be assigned grants from other users.

STIG Manager will automatically create its own user associations for Collection grants once a KeyCloak authenticated user accesses the system. The roles Admin, Collection Creator, and Global Access are visible in the User Grants administrative tab, but must be managed in Keycloak. Specific Grants to Collections and Assets/STIGs are managed in the STIG Manager app.


## Database - MySQL 8.0.4+
STIG Manager has been tested with MySQL 8.0.21.

The API requires knowledge of 1) the DB address/port, 2) which schema (database) is used for STIG Manager, and 3) User credentials with necessary privileges on that schema. The API includes a database migration function which tracks the schema version and if necessary can automatically update the schema at launch. The initial run of the API scaffolds all database objects and static data.
[More information about MySQL.](https://dev.mysql.com/doc/)

### Configure MySQL

STIG Manager requires a database schema, and the use of an account with SuperUser privileges on the intended schema:
  * Create schema - suggested value: stigman
  * Create user - suggested value: stigman
  * Grant User all privileges on created schema (`grant all on *stigman* schema to *stigman* user`). 

The above steps are sufficient for a username/password setup, but it is highly recommended that you configure MySQL to use TLS connections.

#### Configure MySQL for TLS

Configure MySQL to use TLS by altering the `/etc/mysql/conf.d/tls.cnf` file, specifying the certificates it should use, and requiring TLS connections.
Sample Configuration:
```
[mysqld]
ssl-ca=/etc/certs/ca.pem
ssl-cert=/etc/certs/server-cert.pem
ssl-key=/etc/certs/server-key.pem
require_secure_transport=ON
```
Place the certificates in the locations specified in the .cnf file. This sample tls.cnf file can be found in our [sample orchestration repo on GitHub](https://github.com/NUWCDIVNPT/stig-manager-docker-compose/blob/main/tls/mysql/tls.cnf).

The stigman API user must be altered in MySQL such that it is identified by the subject of the valid X.509 certificate it will use to connect. The following command, customized to suit your certificates, will accomplish this:
`ALTER USER stigman@'%' IDENTIFIED BY '' REQUIRE SUBJECT '/C=US/ST=California/L=Santa Clara/CN=fake-client';`

[A sample orchestration for STIG Manager configured with TLS is available.](https://github.com/NUWCDIVNPT/stig-manager-docker-compose)

[More information about configuring MySQL to use encrypted connections.](https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html)

### Configure STIG Manager to use your MySQL Database
Specify your MySQL DB with the following Environment Variables:
 * `STIGMAN_DB_HOST` - Default: localhost - The database hostname or IP from to the API server
 * `STIGMAN_DB_PORT` - Default: 50001 - The database TCP port relative to the API server
 * `STIGMAN_DB_USER` - Default: stigman - The user account used to login to the database
 * `STIGMAN_DB_SCHEMA` - Default: stigman - The schema where the STIG Manager object are found
 * `STIGMAN_DB_PASSWORD` - The database user password. Not required if configuring TLS connections, as shown below.

To enable TLS connections with your MySQL database, specify the following Environment Variables:
 * `STIGMAN_DB_TLS_CA_FILE` - A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database. 
 * `STIGMAN_DB_TLS_CERT_FILE` - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client.
 * `STIGMAN_DB_TLS_KEY_FILE` - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client.


[A sample orchestration for STIG Manager configured for TLS to MySQL is available.](https://github.com/NUWCDIVNPT/stig-manager-docker-compose) This sample orchestration uses self-signed certificates and should be used for testing purposes only.


## Additional Suggested Configuration
### Configure a Reverse Proxy or Kubernetes Ingress Controller
To support HTTPS connections, STIG Manager components should be situated behind a reverse proxy or in a Kubernetes cluster.  Configure the reverse proxy (such as nginx) or the Kubernetes Ingress Controller in accordance with publisher documentation, local security requirements, and Keycloak documentation.
In either case, you will have to set Keycloak environment variable `PROXY_ADDRESS_FORWARDING=true`  and make sure appropriate headers are forwarded.

### Configure Logging
STIG Manager outputs logging messages to standard output.  If your security requirements require you to keep these logs, that should be configured in Kubernetes or using a Docker logging driver.

# First Steps
See the [ADMIN Quickstart Guide](Admin_Guide.md).

# Environment Variables

Check the [Environment Variables](Environment_Variables.md) document for an exhaustive list of Environment Variables and their default values.

# Container Information

For more information, and a sample orchestration, please see our [Docker Hub site.](https://hub.docker.com/repository/docker/nuwcdivnpt/stig-manager)

