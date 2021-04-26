
.. _Installation and Setup walkthrough:

STIG Manager OSS Setup and Technical Information
########################################################## 

STIG Manager has been developed and tested in a Docker container. Using the container is the recommended way to run, but not required. 

Components 
============

.. thumbnail:: /assets/images/stigman-components-basic.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram


-------------------------------


API
------

The STIG Manager API is a RESTful API using Node.js 14+ and the Express web application framework. Exposes 1 HTTP port. TLS support can be provided by a reverse proxy, such as nginx.

Client
---------

The STIG Manager Client is using the ExtJS 3.4 application framework under the GNU General Public License.



Setup Options
===============

STIG Manager requires Node.js 14+, Keycloak, and a MySQL Database. It is configured using :ref:`Environment Variables`, and can be deployed as a container from the image provided on Docker Hub or directly from source code.  


Container Deployment with Docker Desktop
-------------------------------------------------

Using the STIG Manager container image is the recommended way to deploy the app. These instructions specify a Docker Desktop deployment, but the app will run just as well in a Kubernetes or other orchestration environment. Using this deployment approach satisfies the application's NodeJS requirement.

Requirements
~~~~~~~~~~~~~~

`Docker <https://www.docker.com/get-started>`_

Procedure
~~~~~~~~~~~~~~~~~~~~~

#. Install Docker 
#. Install and configure the Authentication and Database requirements. Sample configuration instructions for these requirements can be found here:

   - :ref:`keycloak`
   - :ref:`mySQL`

   *Make note of the address and ports these servers are using (as well as any other values that differ from the defaults). Set the appropriate* :ref:`Environment Variables` *to these values so STIG Manager will be able to reach them*

#. Pull the latest image from Docker Hub. This command will grab the image based on the Iron Bank NodeJS 14 hardened image:  ``docker pull nuwcdivnpt/stig-manager:latest-ironbank``
#. Run the STIG Manager image. Specify Environment Variables if the defaults in the :ref:`Environment Variables` reference do not work for your environment. Set the Environment Variables using ``-e <Variable Name>=<value>`` parameters. A sample docker run command, exposing port 54000, and creating a container named "stig-manager" is shown here:

   .. code-block:: bash

      docker run --name stig-manager \
      -p 54000:54000 \
      -e STIGMAN_DB_HOST=<DATABASE_IP> \
      -e STIGMAN_DB_PORT=<DATABASE_PORT> \
      -e STIGMAN_API_AUTHORITY=http://<KEYCLOAK_IP>:<KEYCLOAK_PORT>/auth/realms/stigman \
      nuwcdivnpt/stig-manager


#. Check the logs by running ``docker logs`` to verify successful startup.  Sample log entries showing the end of a successful startup are shown below.  Check the :ref:`logging` reference for more detailed information.

  .. code-block :: bash

      [START] Checking classification...
      [START] Server is listening on port 64001
      [START] API is available at /api
      [START] API documentation is available at /api-docs
      [START] Client is available at /




Deployment from Source Code
-------------------------------

STIG Manager can be deployed from source if the proper Node.js runtime is provided. These instructions relate to a Windows deployment, but the app will run just as well wherever Node.JS is available. 


Requirements
~~~~~~~~~~~~~~

- `Node.js 14.15+ <https://nodejs.org/en/>`_
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
  If running from source with a clone of the GitHub repository, the client is located at ``../../clients/exts`` relative to the API directory. Set this with the ``STIGMAN_CLIENT_DIRECTORY`` Environment Variable.

.. note::
  It is recommended that you make use of a process manager such as `PM2 <https://github.com/Unitech/pm2>`_ when deploying from source, to monitor the app and keep it running.


Common Configuration Variables
-------------------------------------------------

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

    - STIGMAN_API_AUTHORITY
    - STIGMAN_CLIENT_KEYCLOAK_AUTH

  * General Configuration:
    
    - STIGMAN_API_ADDRESS
    - STIGMAN_API_PORT
    - STIGMAN_CLASSIFICATION
  
  * Swagger OpenAPI Tool Configuration:

    - STIGMAN_SWAGGER_ENABLED
    - STIGMAN_SWAGGER_AUTHORITY
    - STIGMAN_SWAGGER_REDIRECT

STIG Manager can be configured to download and import the latest STIG library on first startup. These options require access to `https://public.cyber.mil <https://public.cyber.mil/stigs/>`_ to complete. STIGs can also be imported manually. Enable this function by setting these Variables to "true":

  * STIGMAN_INIT_IMPORT_STIGS
  * STIGMAN_INIT_IMPORT_SCAP


Additional Suggested Configuration
=======================================

TLS
----
:ref:`Set up TLS with a reverse proxy to secure connections to STIG Manager. <reverse-proxy>`

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

Users are not created in the STIG Manager application itself. All users must be present in Keycloak and be assigned the appropriate roles before they can access the sytem. Upon first access after successful Keycloak Authentication, STIGMan will create a user profile to which it assigns Collection Grants and assignments. 

Assign Users the appropriate roles. In Keycloak, this can be done using the "Role Mappings" tab for that user, or you can set these roles as defaults using the Configure->Roles->Default Roles interface.

Assign at least one User the ``admin`` role when setting up STIG Manager for the first time. 

.. list-table:: STIG Manager User Types, STIG Manager Privileges, and the required Roles: 
  :widths: 20 60 20
  :header-rows: 1
  :class: tight-table

  * - User Type
    - Privileges
    - Roles
  * - Administrator User
    - Access STIG Manager, Manage Collections, Import STIGs, Manage Users, Import/Export App data
    - admin, user
  * - Collection Creator User
    - Access STIG Manager, Create Collections
    - user, create_collection
  * - Restricted User  
    - Access STIG Manager
    - user
  * - Global Access User
    - Access STIG Manager, Access to ALL Collection data
    - user, global_access

.. note::
   All Users must be explicitly granted access to Collections in order to see the Assets, STIGs, and Evaluations contained therein. Administrators can grant themselves or others access to Collections.  The exception to this rule is the "Global Access" privilege type, which has access to all Collection data. This privilege should only be granted with great care, and is a candidate for removal in future versions of STIGMan. 


It is recommended that most users should be "Collection Creator Users"(ie. assigned the "user" and "create_collection" roles). A Restricted User will only have access to grants they have been assigned by other users. Collection Creator Users can create and manage their own collections, as well as be assigned grants from other users.

STIG Manager will automatically create its own user associations for Collection grants once a KeyCloak authenticated user accesses the system. The roles Admin, Collection Creator, and Global Access are visible in the User Grants administrative tab, but must be managed in Keycloak. Specific Grants to Collections and Assets/STIGs are managed in the STIG Manager app.


Import STIGs
------------------

Up until this point, the setup has concerned the actual operational deployment of the app.  For this function, and additional functions of the App, STIG Manager Users are required.  See the :term:`User` for more information on their different roles and privileges. 

#. Download the latest `quarterly STIG Library Compilations from DISA <https://public.cyber.mil/stigs/compilations/>`_ and import it into STIG Manager. 

#. Log in to STIG Manager using an Administrator user to import STIGs. For information on how to do this, and other STIG Managager Admin functions, see the :ref:`stig-import` portion of the :ref:`admin-quickstart`. 



