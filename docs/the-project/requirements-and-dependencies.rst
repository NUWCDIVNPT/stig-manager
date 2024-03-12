.. _requirements-and-dependencies:


Requirements and Dependencies
#############################################

STIG Manager is under active development. Only the latest `release <https://github.com/NUWCDIVNPT/stig-manager/releases>`_ will be supported. If you experience any problems, we encourage you to make sure you are running the latest release before creating an issue. 


Requirements
======================================

Software Requirements
------------------------
- Node.js LTS
- MySql 8.0.21+
- OIDC Provider (Such as RedHat Keycloak 19+)


Tested with:

- Docker 20.10.2
- NodeJs provided by node:lts-alpine image on Docker Hub
- MySQL - latest 3 minor versions of the MySQL 8.0.x series available on Docker Hub.
- RedHat Keycloak 19+

.. note::
  The STIG Manager API itself is stateless, and persists no data. All application data is stored in the deployer-provided MySQL database. Responsibility for data security and backup is entirely the responsibility of the deployer maintaining the database. 
  Likewise, the OIDC Provider is responsible for user authentication and authorization, and the deployer is responsible for the security and backup of the OIDC Provider.


Dependencies
======================================

Please see the `package-lock.json file in our repo. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/package-lock.json>`_





