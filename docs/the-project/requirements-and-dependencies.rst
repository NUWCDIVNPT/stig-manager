.. _requirements-and-dependencies:


STIG Manager Requirements and Dependencies
#############################################

STIG Manager is under active development. Only the latest `release <https://github.com/NUWCDIVNPT/stig-manager/releases>`_ will be supported. If you experience any problems, we encourage you to make sure you are running the latest release before creating an issue. 


Requirements
======================================

Software Requirements
------------------------
- Node.js 14+
- MySql 8.0.14+ 
- RedHat Keycloak 11+


Tested with:

- Docker 20.10.2
- NodeJs provided by node:lts-alpine image on Docker Hub
- NodeJs provided by registry1.dso.mil/ironbank/opensource/nodejs/nodejs14:latest image on Iron Bank
- MySQL provided by mysql:latest image on Docker Hub


Hardware Requirements
--------------------------

Relatively lightweight, but hardware requirements are still being determined. 



Dependencies
======================================

Please see the `package-lock.json file in our repo. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/package-lock.json>`_





