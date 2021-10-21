.. _security-promises:


STIG Manager Security
#############################################################


The STIG Manager Team takes security very seriously, and have developed the application in accordance with known best practices and guidelines. 


STIG Manager's Security Promises
====================================

STIG Manager offers the following Security Promises:
    - User access to endpoints that return managed data require a valid OIDC token provided by the configured Authentication Provider. That token must express the proper scopes and privileges required for the endpoint they are attempting to access.  
    - Users only get access to the data they should: Once granted access to STIG Manager, Users will only get access to data in accordance with their Collection Access Levels.
    - A large battery of tests are run against every code submission to the repository. These tests check for both basic functionality and that User data access controls are functioning as expected. Tests actively attempt to cross User Access Level boundaries and flag any failure of access control.
    - Requests that use elevated access (aka "admins/application managers" requesting it) get logged (as do all endpoint requests), and their new access level is indicated in the application along with other users:

        - Logs will show an admin made an elevated request to grant themselves access to a Collection. They do not *acccess* the data via elevation, they grant themselves an appropriate level of access, then access the data as a normal user with that grant. This is logged. All current users with access to a Collection are indicated as part of the Collection Management interface. 
    - Dependency vulnerabilities and notifications provided by automated Dependabot scans.
    - Periodic SonarCloud scans. And Snyk scans, apparently.
    - Every container image delivery is checked to ensure it builds successfully with the Iron Bank hardened NodeJs base image. 
    - A Healthcheck endpoint is provided. 
    - Ingress is via one configurable port.
    - Optional one-time egress to access public.cyber.mil for initial STIG Library load. 
    - Optional TLS connections to the database. 
    - STIG Manager is offered as a stateless container (and/or application). No data is stored on the application system or container except the application itself. All data managed is stored in the external database. 
    - The application is actively maintained.
    - Write access to the codebase is restricted via GitHub account permissions. 





Security Is a Holistic Endeavor
==========================================

STIG Manager is only as secure as the environment it runs in. Those deploying the tool are responsible for making sure their deployment conforms with their organization's Security and Data Retention Policies. 

Specific, but not necessarily exclusive, areas that remain the responsibility of those making use of the software:
    - Run Scans of the software or containers. The STIGMan Team runs their own scans, but your organization may have special requirements in this area.

        - If you see something, say something. If your scans indicate a security flaw that you think should be addressed in the application, create an issue on the GitHub repo informing us of it. 
    - Use an Authentication Provider configured in accordance with your policies, that can provide an OIDC token in conformance with STIGMan requirements (see :ref:`authentication`).
    - Secure your database in accordance with your organization's policies, and STIGMan's requirements (see :ref:`db`).
    - Provide a TLS proxy for secure connections  (see :ref:`reverse-proxy`). 
    - Retain the logs that STIGMan produces (available on stdout) in accordance with your organization's policies (see :ref:`logging`). 
    - Provide a secure runtime environment. A properly configured kubernetes deployment, or a server with NodeJS, for example (see :ref:`installation-and-setup`). If you are building your own container images, ensure the base images meet your security criteria. 



Container Images on Docker Hub
=====================================

The container images available on Docker Hub have been created in accordance with guidance provided by the DoD Container Image Creation and Deployment Guide. 







    
