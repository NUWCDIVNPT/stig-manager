
.. _installation-and-setup:

STIG Manager OSS Setup and Technical Information
########################################################## 

The STIG Manager open-source project provides an API and Web Client. The project is ideal for deployment as containerized service components that are part of a fully orchestrated individual or enterprise STIG Manager web application, but can also be run from source code in a Node.js runtime environment. 

Several deployment approaches are described in this document:

- :ref:`Deploy our sample Docker Compose orchestration<deploy-docker-compose>`
- :ref:`Deploy with individual containers <deploy-container>`
- :ref:`Deploy from source code in Node.js runtime environment <deploy-from-source>`
- :ref:`Deploy with executable binaries <deploy-binaries>`

A STIG Manager deployment requires at least two other mandatory services, which are freely available but must be provided and configured by the those deploying the STIG Manager instance:
  - An OpenID Connect (OIDC) Provider
  - A MySQL database

A sample orchestration, which includes the STIGMan API, Web Client, a Keycloak container, and a MySQL container, is available on our Docker Hub page. Follow the `Quick Start Orchestration instructions on Docker Hub. <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_

The STIG Manager application is often deployed at the enterprise level with orchestration platforms such as Kubernetes or OpenShift. However, containerization allows STIG Manager deployments to be readily scaled up or down and it can be orchestrated on a single laptop with tools such as docker-compose.

.. note::
  Containerized deployments of STIG manager are highly recommended because they offer improved security, scalability, portability, and maintenance. If absolutely necessary, it is possible to deploy the STIG Manager API in legacy environments from source code, but this is not recommended for secure deployments and is not fully documented. 



Common Components 
=================

.. thumbnail:: /assets/images/stigman-components-basic.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram



-------------------------------

The required and optional components of a STIG Manager OSS deployment:

**API** (Always Required)
  A RESTful API implemented on the current LTS version of Node.js and the Express web application framework. Exposes 1 HTTP port. Built as a stateless container service.
**Web Client** (Recommended for Interactive Access)
  A Single Page Application (SPA) using the ExtJS 3.4 JavaScript framework. The Web Client is often enabled as static content from the API container which does not require a separate container.
**OIDC Provider**  (Always Required)
  An authentication service that manages user accounts and issues OAuth2 JWT tokens to the Web Client which authorize access to the API. We routinely test using Red Hat Keycloak and fully support Keycloak as an OIDC Provider of choice. More limited testing has been done using authentication services from Okta and Azure AD.
**MySQL Database**  (Always Required)
  A stateful data storage capability that supports mutual TLS authentication and secure data at rest. STIGMan OSS supports MySQL 8.0.14 and above.

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

- `Node.js 16.13+ <https://nodejs.org/en/>`_
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



.. _deploy-binaries:

Deployment with Executable Binaries
---------------------------------------------

STIG Manager releases include .zip and .tar files containing a single executable binary that includes NodeJS, the STIGMan OSS API and Client, and required NodeJS packages. 


Requirements
~~~~~~~~~~~~~~

- :ref:`OIDC Authentication Provider <keycloak>`
- :ref:`mySQL`


Procedure
~~~~~~~~~~~~~~~~~~~~~


#. Download the appropriate STIG Manager OSS artifact from `the latest release <github.com/nuwcdivnpt/stig-manager/releases>`__ and unzip/untar into the desired directory.
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so STIG Manager will be able to reach them*

#. Set Environment Variables as appropriate for your environment. 
#. Run the executable. 

.. note::
  It is recommended that you make use of a process manager such as `PM2 <https://github.com/Unitech/pm2>`_ when deploying the executable, to monitor the app and keep it running.



Environment Variables
===============================================

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
  

Additional Suggested Configuration
=======================================

TLS
----
:ref:`Set up TLS with a reverse proxy to secure connections to STIG Manager. <reverse-proxy>`


Enable Extra CA Certificates
----------------------------------------
Set the ``NODE_EXTRA_CA_CERTS=file-path`` Node.js environment variable to direct Node to accept CA certificates you have provided, in addition to its built-in CA certs. In the case of the Iron Bank based image, DoD CA certificates are already located here: ``/etc/pki/ca-trust/source/anchors/Certificates_PKCS7_v5.7_DoD.pem``

Check the `Node.js documentation for more information. <https://nodejs.org/api/cli.html#cli_node_extra_ca_certs_file>`_


Configure Logging
-----------------------
:ref:`Store logs according to Organization requirements. <logging>`

First Steps
==============


Up until this point, the setup has concerned the actual operational deployment of the app.  For STIG Manager to function effectively, it also requires:
  - Users.
  - A set of baseline STIGs for reference. 

.. index::
   single: Add Users

.. _Adding Users:
.. _Add Users:
.. _user-roles-privs:

Configure Users
--------------------------

Users are not created in the STIG Manager application itself. All users must be authenticated by your Authentication Provider (Often, Keycloak), which must provide them with an appropriately configured OIDC token. This token must express the user name, privileges, and scopes in accordance with the configuration you have set using the API and Client environment variables.  Upon first access after successful Authentication, STIGMan will create a user profile to which it assigns Collection Grants and assignments. 

See the :ref:`Authentication and Identity<authentication>` section for more information about configuring your Authentication Provider. 

Assign at least one User the ``admin`` privilege when setting up STIG Manager for the first time. That user will be responsible for importing the baseline DISA STIGs that STIG Manager uses for reference. 

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

.. note::
   The User Privileges above control levels of access to the overall application, and are distinct from Collection Grants.  Collection Grants control access to individual Collections, and are managed in the application, not the OIDC Provider.  All Users must be explicitly granted access to Collections in order to see the Assets, STIGs, and Evaluations contained therein. Administrators can grant themselves or others access to any Collection. 

It is recommended that most users should have the "create_collection" privilege. A User with no privileges will only have access to Collections that they have been assigned grants to by other users. Collection Creator Users can create and manage their own collections, as well as be assigned grants from other users.

Users with the Admin and Collection Creator privileges are indicated in the User Grants Application Management tab, but must be managed in the Authentication Provider. Only specific Grants to Collections and Assets/STIGs are managed in the STIG Manager app.

 See the term :term:`User` in the glossary for more information about Users and their access to the application. 



Import STIGs
------------------

STIG Manager requires a set of the published DISA STIGs to serve as a reference for making STIG assignments to Assets and calculating statistics, as well as populating its browsable STIG Library.  This action can only be performed by Application Managers (ie. users with the "admin" privilege). 

#. Download the latest `quarterly STIG Library Compilations from DISA <https://public.cyber.mil/stigs/compilations/>`_. 

#. Log in to STIG Manager using an Application Manager user and import STIGs via the "STIG and SCAP Benchmarks" interface. For more information about this operation, and other STIG Manager Admin functions, see the :ref:`stig-import` portion of the :ref:`admin-quickstart`. 



