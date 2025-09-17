
.. _installation-and-setup:

STIG Manager OSS Setup and Technical Information
########################################################## 

The STIG Manager open-source project provides an API and Web Client. The project is ideal for deployment as containerized service components that are part of a fully orchestrated individual or enterprise STIG Manager web application, but can also be run from source code in a Node.js runtime environment, or precompiled binaries. 

Several deployment approaches are described in this document:

- :ref:`Deploy our sample Docker Compose orchestration<deploy-docker-compose>`
- :ref:`Deploy our sample Docker Compose orchestration with CAC Authentication and nginx proxy <deploy-docker-compose-CAC>`
- :ref:`Deploy with Individual Containers <deploy-container>`
- :ref:`Deploy from Source Code in Node.js runtime environment <deploy-from-source>`
- :ref:`Deploy precompiled binaries <deploy-with-binaries>`


A STIG Manager deployment requires at least two other mandatory services, which are freely available but must be provided and configured by the those deploying the STIG Manager instance:
  - An OpenID Connect (OIDC) Provider
  - A MySQL database

The project offers two sample container orchestrations that bring up "starter" deployments that could be used as a point of reference for  production deployments:
  - Our `Quick Start Orchestration instructions on Docker Hub <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_ offers an orchestration for the STIGMan API, Web Client, a Keycloak container, and a MySQL container. Individual container ``docker run`` commands are also offered. 

  - Our `STIGMan Orchestration repository <https://github.com/NUWCDIVNPT/stigman-orchestration>`_ offers an orchestration that includes the STIGMan API, Web Client, Keycloak container, MySQL container, and nginx proxy that implements CAC authentication. 

The STIG Manager application is often deployed at the enterprise level with orchestration platforms such as Kubernetes or OpenShift. However, containerization allows STIG Manager deployments to be readily scaled up or down and it can be orchestrated on a single laptop with tools such as docker-compose.

.. note::
  Containerized deployments of STIG manager are highly recommended because they offer improved security, scalability, portability, and maintenance, but they are not required. It is entirely possible to deploy the STIG Manager API and some or all supporting applications in a traditional manner from source code or installers.  In almost all cases, the same configuration options documented here or elsewhere would apply. 



Common Components 
=================

.. thumbnail:: /assets/images/stigman-components-basic.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram



-------------------------------

Required and optional components of a STIG Manager OSS deployment:

**API** (Always Required)
  A RESTful API implemented on the current LTS version of Node.js and the Express web application framework. Exposes 1 HTTP port. Built as a stateless container service.
**Web Client** (Recommended for Interactive Access)
  A Single Page Application (SPA) using the ExtJS 3.4 JavaScript framework. The Web Client is often enabled as static content from the API container which does not require a separate container.
**OIDC Provider**  (Always Required)
  An authentication service that manages user accounts and issues OAuth2 JWT tokens to the Web Client which authorize access to the API. We routinely test using Red Hat Keycloak and fully support Keycloak as an OIDC Provider of choice. More limited testing has been done using authentication services from Okta and Azure AD.
**MySQL Database**  (Always Required)
  A stateful data storage capability that supports mutual TLS authentication and secure data at rest. 


.. note::
  The STIG Manager API itself is stateless, and persists no data. All application data is stored in the deployer-provided MySQL database. Responsibility for data security and backup is entirely the responsibility of the deployer maintaining the database. 
  Likewise, the OIDC Provider is responsible for user authentication and authorization, and the deployer is responsible for the security and backup of the OIDC Provider.


-------------------------------


Deployment Scenarios
===============================================


.. _deploy-docker-compose:

Quick Start Orchestration with Docker Compose
-------------------------------------------------

Requirements
~~~~~~~~~~~~~~

- `Docker <https://www.docker.com/get-started>`_

To quickly establish a demonstration instance of STIG Manager, follow the `Quick Start Orchestration instructions on Docker Hub. <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_


.. _deploy-docker-compose-CAC:

Deploy our Sample Docker Compose Orchestration with CAC Authentication and nginx Proxy
--------------------------------------------------------------------------------------------

Requirements
~~~~~~~~~~~~~~

- `Please see the guide provided in our STIGMan Orchestration repository. <https://github.com/NUWCDIVNPT/stigman-orchestration>`_

To quickly establish a demonstration instance of STIG Manager with CAC Authentication and nginx proxy, follow the `guide provided in our STIGMan Orchestration repository. <https://github.com/NUWCDIVNPT/stigman-orchestration>`_


.. _deploy-container:

Container Deployment with Docker
-------------------------------------------------

Using the STIG Manager container image is the recommended way to deploy the app. These instructions specify a Docker deployment, but the app will run just as well in a Kubernetes or other orchestration environment. Using this deployment approach satisfies the application's NodeJS requirement.

Requirements
~~~~~~~~~~~~~~

- `Docker <https://www.docker.com/get-started>`_
- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`


Procedure
~~~~~~~~~~~~~~~~~~~~~

#. Install Docker 
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so STIG Manager will be able to reach them*

#. Pull the latest image from Docker Hub. This command will grab the image based on the Iron Bank NodeJS hardened image:  ``docker pull nuwcdivnpt/stig-manager:latest-ironbank``
#. Run the STIG Manager image using the ``docker run`` command. Specify Environment Variables if the defaults in the :ref:`Environment Variables` reference do not work for your environment. Set the Environment Variables using ``-e <Variable Name>=<value>`` parameters. A sample docker run command, exposing port 54000, and creating a container named "stig-manager" is shown here:

   .. code-block:: bash

      docker run --name stig-manager -d \
      -p 54000:54000 \
      -e STIGMAN_DB_HOST=<DATABASE_IP> \
      -e STIGMAN_DB_PORT=<DATABASE_PORT> \
      -e STIGMAN_OIDC_PROVIDER=http://<KEYCLOAK_IP>:<KEYCLOAK_PORT>/auth/realms/stigman \
      nuwcdivnpt/stig-manager


#. Check the logs by running ``docker logs`` to verify successful startup.  Sample log entries showing the end of a successful startup are shown below.  Check the :ref:`logging` reference for more detailed information.

  .. code-block :: bash

      [START] Checking classification...
      [START] Server is listening on port 64001
      [START] API is available at /api
      [START] API documentation is available at /api-docs
      [START] Client is available at /


.. _deploy-from-source:

Deployment from Source Code
-------------------------------

STIG Manager can be deployed from source if the proper Node.js runtime is provided. These instructions relate to a Windows deployment, but the app will run just as well wherever Node.js is available. 


Requirements
~~~~~~~~~~~~~~

- `Node.js LTS <https://nodejs.org/en/>`_
- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`
- `git <https://git-scm.com/downloads>`_ *(recommended)*


Procedure
~~~~~~~~~~~~~~~~~~~~~


#. Install Node.js  
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so STIG Manager will be able to reach them*

#. Using git, Clone the repository or just download from the `release archive directly <github.com/nuwcdivnpt/stig-manager/releases>`__ and unzip into the desired folder. ``git clone https://github.com/NUWCDIVNPT/stig-manager.git``
#. Navigate to ``/api/source`` directory in the project folder. 
#. Run ``npm ci`` to install the required Node.js packages specified in the package-lock.json file. 
#. Set Environment Variables as appropriate for your environment. Windows cmd example: ``set STIGMAN_DB_HOST=10.0.0.6``
#. From the ``/api/source`` directory, start Node, specifying the index.js file:  ``node index.js``

.. note::
  When running from source, the client files are located at ``../../client/src`` relative to the API directory. You can build a minimized client distribution by running ``client/build.sh``, which will place files at ``../../client/dist``. Set the ``STIGMAN_CLIENT_DIRECTORY`` environment variable as appropriate.

.. note::
  It is recommended that you make use of a process manager such as `PM2 <https://github.com/Unitech/pm2>`_ when deploying from source, to monitor the app and keep it running.

.. _deploy-with-binaries:

Deployment with Precompiled Binaries
--------------------------------------

STIG Manager can be deployed with the binaries made available `with each release. <https://github.com/NUWCDIVNPT/stig-manager/releases>`_


Requirements
~~~~~~~~~~~~~~

- `Precompiled Binaries <https://github.com/NUWCDIVNPT/stig-manager/releases>`_
- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`


Procedure
~~~~~~~~~~~~~~~~~~~~~


#. Download the `precompiled binaries <https://github.com/NUWCDIVNPT/stig-manager/releases>`_
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so STIG Manager will be able to reach them*

#. Set Environment Variables as appropriate for your environment. Windows cmd example: ``set STIGMAN_DB_HOST=10.0.0.6``
#. Run the downloaded binaries. 


.. note::
  It is recommended that you make use of a process manager such as `PM2 <https://github.com/Unitech/pm2>`_ when deploying from source or binaries, to monitor the app and keep it running.


Updating STIG Manager
-------------------------------------------------

Because the STIG Manager API itself is stateless, updates are relatively simple. Follow the same procedure as the initial deployment, but with the updated version of the app, configured to use the same OIDC and database resources.

Some releases may require database schema changes. In these cases, the app will automatically apply the necessary changes to the database schema when it starts up. These changes can occasionally take several minutes to run if your data set is large. We note these "Database Migrations" in our Release Notes. We recommend updates be performed during a maintenance window, and that a current database backup is available.

Most updates do not require database migrations.

Downgrading STIG Manager to an earlier version is not supported. If you need to revert to an earlier version, you will need to restore the database from a backup taken with the earlier version.

| 

Common Configuration Variables
-------------------------------------------------
The API and Web Client are configured using :ref:`Environment Variables`. They neither require nor use a configuration file.

It is likely you will have to set at least some of these Environment Variables, but check the full :ref:`Environment Variables` reference for the full list:

  * Database-related:

    - STIGMAN_DB_HOST
    - STIGMAN_DB_PORT
    - STIGMAN_DB_USER 
    - STIGMAN_DB_PASSWORD (unless using TLS for authentication)
    - STIGMAN_DB_TLS_CA_FILE 
    - STIGMAN_DB_TLS_CERT_FILE (unless using password for authentication)
    - STIGMAN_DB_TLS_KEY_FILE (unless using password for authentication)

  * Authentication-related:

    - STIGMAN_OIDC_PROVIDER
    - STIGMAN_CLIENT_OIDC_PROVIDER

  * General Configuration:
    
    - STIGMAN_API_ADDRESS
    - STIGMAN_API_PORT
    - STIGMAN_CLASSIFICATION
  
  * Swagger OpenAPI Tool Configuration:

    - STIGMAN_SWAGGER_ENABLED
    - STIGMAN_SWAGGER_AUTHORITY
    - STIGMAN_SWAGGER_REDIRECT

Additional Suggested Configuration
=======================================

Customize Welcome Message and Logo
-----------------------------------

The Welcome Message and Image can be customized with environment variables to present additional information or guidance to users upon login. These variables all begin with ``STIGMAN_CLIENT_WELCOME_``. See the :ref:`Environment Variables` reference for more information.

.. thumbnail:: /assets/images/welcome-message-customizable-elements.png
  :width: 25%
  :show_caption: True 
  :title: Welcome Message Customizable Elements


Proxy Configuration for TLS and Streaming/SSE Endpoints
------------------------------------------------------------------

TLS
~~~~~~~~~~~~~~

:ref:`Set up TLS with a reverse proxy to secure connections to STIG Manager. <reverse-proxy>`

Configure Proxy for Real-time Operations
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

STIG Manager uses streaming responses and Server-Sent Events (SSE) for real-time collection operations and status updates. Most proxy configurations work without modification, but some may require adjustments.

:ref:`Ensure your proxy properly handles streaming and SSE endpoints <reverse-proxy>` to ensure proper functionality of:

* Real-time progress updates during collection export and clone operations
* Live operation status monitoring
* Future WebSocket-based features


Enable Extra CA Certificates
----------------------------------------
Set the ``NODE_EXTRA_CA_CERTS=file-path`` Node.js environment variable to direct Node to accept CA certificates you have provided, in addition to its built-in CA certs. In the case of the Iron Bank based image, DoD CA certificates are already located here: ``/etc/pki/ca-trust/source/anchors/Certificates_PKCS7_v5.7_DoD.pem``

Check the `Node.js documentation for more information. <https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file>`_


Configure Logging
-----------------------
:ref:`Store logs according to Organization requirements. <logging>`

First Steps
==============

.. index::
   single: Add Users

.. _Adding Users:
.. _Add Users:
.. _user-roles-privs:

Configure Users
--------------------------

Users are not created in the STIG Manager application itself. All users must be authenticated by your Authentication Provider (often, Keycloak), which must provide the appropriate tokens, scopes, and privileges before they can access the system. Upon first access after successful Authentication, STIGMan will create a user profile to which it assigns Collection Grants and assignments. 

User privileges are controlled by the OIDC Provider. This can be done by configuring the OIDC provider to generate tokens for Users that include their privileges and scopes in the specified claims (``STIGMAN_JWT_PRIVILEGES_CLAIM`` and ``STIGMAN_JWT_SCOPE_CLAIM``).  In most OIDC Providers, this can be done in multiple ways, depending on your use case.  One option for Keycloak is using the "Role Mappings" tab for that user, or you can set these privileges as defaults using the Configure->Roles->Default Roles interface.  See the :ref:`Authentication and Identity<authentication>` section for more information. 

Assign at least one User the ``admin`` privilege when setting up STIG Manager for the first time. 

.. list-table:: STIG Manager User Types, STIG Manager Privileges, and possible Keycloak Roles: 
  :widths: 20 60 20
  :header-rows: 1
  :class: tight-table

  * - User Type
    - Privileges
    - Keycloak Roles
  * - Administrator User
    - Access STIG Manager, Manage Collections, Import STIGs, Manage Users, Import/Export App data
    - admin, user
  * - Collection Creator User
    - Access STIG Manager, Create Collections
    - user, create_collection
  * - User
    - Access STIG Manager
    - user

.. note::
   All Users must be explicitly granted access to Collections in order to see the Assets, STIGs, and Evaluations contained therein. Administrators can grant themselves or others access to any Collection. 

It is recommended that most users should be "Collection Creator Users"(ie. assigned the "create_collection" privilege).  Collection Creator Users can create and manage their own collections, as well as be assigned grants from other users.

STIG Manager will automatically create its own user associations for Collection grants once an authenticated user accesses the system. User Privileges (ie. "admin" and/or "create_collection") are visible in the User administrative tab, but must be managed in the Authentication Provider. Specific Grants to Collections and Assets/STIGs are managed in the STIG Manager app.


Import STIGs
------------------

Up until this point, the setup has concerned the actual operational deployment of the app.  For this function, and additional functions of the App, STIG Manager Users are required.  See the :term:`User` for more information on their different roles and privileges. 

#. Download the latest `quarterly STIG Library Compilations from DISA <https://public.cyber.mil/stigs/compilations/>`_ and import it into STIG Manager. 

#. Log in to STIG Manager using an Administrator user to import STIGs. For information on how to do this, and other STIG Manager Admin functions, see the :ref:`stig-import` portion of the :ref:`admin-quickstart`. 



