.. _examples:


Examples and Sample Data
#############################################################


This document lists examples and sample data resources maintained by the STIG Manager Team.  These examples are intended to demonstrate the functions of the project, and should not be used for Production Deployments without modification. 



Sample Data
===================

`Sample data to populate STIG Manager with an assortment of generated Collections, Assets, STIG Assignments, and Reviews is available in our repo. <https://github.com/NUWCDIVNPT/stig-manager/tree/main/data/appdata>`_

Load this data with the feature described here :ref:`app-data`

This data set will not load unless the `STIG Library Compilation <https://public.cyber.mil/stigs/compilations/>`_ has been imported. 



Containers
======================================

The STIG Manager project delivers the application in the form of two container images on Docker Hub. 
Several sample containers and Docker orchestrations are also provided to easily bring the App up in demonstration or test configurations. 


STIGMan OSS
--------------

alpine Image
~~~~~~~~~~~~~

Based on the latest `NodeJS LTS alpine Linux base image: <https://hub.docker.com/_/node/>`_

`STIGMan OSS based on alpine linux <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_


Iron Bank Image
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Iron Bank images are hardened images produced by a Department of Defense effort and `available to the public here. <https://repo1.dso.mil/>`_

The Image we make available on Docker Hub is based on the `latest image available here. <https://repo1.dso.mil/dsop/opensource/nodejs/nodejs16/-/tree/master>`_

`STIGMan OSS based on Iron Bank NodeJS LTS (RHEL UBI) <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_


Keycloak
==============

`Sample Keycloak configured for Username/Password <https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth>`_

MySQL
=================

The standard `MySQL Image available on Docker Hub <https://hub.docker.com/_/mysql>`_ will work, when started with Environment Variables specified in the Sample Orchestration below. 




STIG Manager Orchestration with nginx, Keycloak, and CAC Authentication
=============================================================================

The STIG Manager OSS team maintains a repository on GitHub with a sample orchestration that includes nginx and Keycloak implementing TLS and CAC Authentication: `<https://github.com/NUWCDIVNPT/stigman-orchestration>`_




