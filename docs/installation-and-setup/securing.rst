.. _securing:


Securing and Assessing STIG Manager Deployments
##########################################################

.. warning::
  You must secure and assess your deployments in compliance with your individual or organizational security requirements. The discussions below are educational. Encouragement to do things a particular way does not constitute advice that overrides your specific requirements.


The STIG Manager application can be orchestrated several ways, each with unique security requirements. We know many deployments must comply with the Application Security and Development STIG - commonly known as the ASD. Therefore we have organized this section around ASD requirements, to provide guidance for those tasked with securing and assessing STIG-compliant STIG Manager deployments.

.. note::
  The ASD assesses many application components, and application governance, using a single checklist of 286 checks (as of V5R1).  Unfortunately, the current ASD provides limited guidance if you're using modern security technologies such as Single Sign On, OpenID Connect, OAuth2 authorization, and containerization. If you are required to complete an ASD assessment, we encourage focusing on the spirit of the checklist until it is updated or re-imagined.

Securing Your Deployment
========================

These are some common security topics to review when designing a secure STIG Manager application deployment.

Container Security
------------------

We strongly encourage STIG Manager deployments to be containerized. Containerization has built-in security advantages such as immutability, image signing, transparency, modularity, small attack surface, secure updates, and environment parity. The content of container images and their runtime behavior require security evaluations, as in traditional deployments, but provide the advantage of image layer inheritance.

.. note::
  If you are subject to ASD-compliance you are likely subject to other DoD requirements. We encourage an in-depth familiarity with the `Container Image Creation and Deployment Guide <https://dl.dod.cyber.mil/wp-content/uploads/devsecops/pdf/DevSecOps_Enterprise_Container_Image_Creation_and_Deployment_Guide_2.6-Public-Release.pdf>`_ from DISA. The STIG Manager Project adheres to DISA image creation guidance when defining and building container images, and we encourage STIG Manager deployments to follow the container deployment guidance.

Image Choice
~~~~~~~~~~~~

Many deployments might directly orchestrate `one of our published images <https://hub.docker.com/r/nuwcdivnpt/stig-manager>`_. For most ASD-compliant deployments, you should deploy one of our Iron Bank based images. Those images follow the naming convention ``nuwcdivnpt/stig-manager:[SEMANTIC-VERSION]-ironbank``. Example: ``nuwcdivnpt/stig-manager:1.0.40-ironbank``. Our Iron Bank-based images are built from the Iron Bank Node.js image, a hardened image that is based on the Iron Bank Universal Base Image (UBI). The UBI is a hardened Red Hat image that has been configured in accordance with applicable DoD requirements.

Some deployments might prefer a custom container image of STIG Manager created by `modifying the Dockerfile from our repo <https://github.com/NUWCDIVNPT/stig-manager/blob/main/Dockerfile>`_ or basing their custom image on one of our published images. In these cases, we strongly encourage use of the relevant Iron Bank base images. To build from the actual Iron Bank Node.js or UBI image, you will need an account at https://ironbank.dso.mil/.

If you need to understand how a container image was built, we encourage familiarity with the `docker history` command.


Vulnerability Scanning
~~~~~~~~~~~~~~~~~~~~~~

We encourage all deployments to perform vulnerability scanning of our published container images. The Project scans our published images with anchore and proprietary Amazon Web Service and Azure tools. We do not currently publish those results but efforts are being considered to make them available.

Organizations should consider deploying their own container registry with embedded image scanning. Choices include the open-source Harbor registry with built-in Clair testing, and cloud-based offerings from Amazon, Azure and Google.

Validating Image Signatures
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The Project signs each image we publish to Docker Hub using Docker Content Trust (DCT).

.. note::
  For secure DCT image verification, you should understand trust-pinning. The default "Trust On First Use" (TOFU) behavior of the docker CE client may not be appropriate for your security requirements. Our `root.json <https://github.com/NUWCDIVNPT/stig-manager/blob/main/root.json>`_ file will be helpful if you wish to pin trust on our signing key.


Data Flow
---------

Several ASD checks refer to SOAP, WS-Security and SAML, early protocols for implementing and securing online APIs. None of the checks refer to REST or OIDC/OAuth2, modern alternatives that are commonly used in cloud-ready software such as STIG Manager. The checks that address SOAP, etc. state that if you aren't using those technologies, the assessment is 'not applicable'.

.. note::
  The discussion below assumes the reader has prerequisite knowledge of REST principles, `OAuth2 flows as defined in RFC 6749 <https://datatracker.ietf.org/doc/html/rfc6749>`_ and the `Open ID Connect Core 1.0 specification <https://openid.net/developers/specs/>`_

.. thumbnail:: /assets/images/data-flow-01b.svg
  :width: 75%
  :show_caption: True 
  :title: Data Flow Diagram

|

REST and OpenAPI Specification (OAS)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The STIG Manager API and Web Client exchange data across a REST architecture that enforces the STIG Manager `OAS definition <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_.

Access to individual endpoints is controlled by the OAuth2 ``scope`` claims listed in each endpoint's ``security.oauth`` property in the OAS. Oauth2 is discussed further below.

Discretionary Access Control (DAC) and Role Based Access Control (RBAC)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The API grants or denies access to STIG Manager data objects (Collections, Assets, Asset/STIG maps, and Reviews) based on the the OAuth2 ``username`` claim (or configured equivalent). The username value indexes into the internal STIG Manager DAC system which includes per-Collection RBAC lists (i.e, Collection Grants and Restricted User Access Lists).

Correct implementation of the STIG Manager data flow, especially the DAC and RBAC logic, is verified by an `automated workflow <https://github.com/NUWCDIVNPT/stig-manager/blob/main/.github/workflows/api-tests.yml>`_ that is performed when any change to the codebase is proposed (a Pull Request or PR). Over 2000 assertions are evaluated using `tests you can review here. <https://github.com/NUWCDIVNPT/stig-manager/tree/main/test/api>`_ These tests are run against every commit to the release branch to evaluate all features of the API and actively try to cross defined access boundaries to test our DAC and RBAC implementations. 

OpenID Connect (OIDC) and OAuth2
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The claims described in the sections above are contained in OAuth2 JWT formatted access_tokens issued by an OIDC Provider to remote clients, such as the Project's Web Client and the STIG Manager Watcher bot.

The Web Client on startup redirects users to the OIDC Provider to authenticate and obtain an access token that defines the scope of API access the user grants that client. For most ASD-compliant deployments, the connection to the OIDC Provider's authorization_endpoint will use MTLS and CAC PKI.

.. note::
  Communication between the API and clients include the access_token and should occur using TLS but do not require Mutual TLS (MTLS). 

The Web Client is a single-page application (SPA) that executes entirely in the browser. Browsers are low- to zero-trust environments where OAuth2 access tokens should have short lifetimes to mitigate the risk of token diversion. Just what is considered 'short' is for you (or your organization) to decide, but 15 minutes or even less is not uncommon.

The Web Client will not engage in an OIDC implicit flow. The OIDC Provider must provide tokens using the OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE). To work with bots such as STIG Manager Watcher, the OIDC Provider should also support the client_credentials flow with Signed JWT authentication.

If your OIDC Provider issues refresh tokens (encouraged for a better user experience), those tokens usually have longer lifetimes than the access_token but should be rotated and limited to a single use. Policies vary greatly, but refresh token lifetime is sometimes correlated to the SSO session lifetime. Attempts to reuse a refresh_token should be logged by the OIDC Provider and generate alerts.

User Sessions
-------------

.. note::
  The discussion below assumes the reader has knowledge of their specific OIDC Provider and any user federation or identity brokering features it is configured to use.

Several ASD checks address the management of user login sessions. It is important to understand how your OIDC Provider controls user sessions, performs user management, and audits its activities.

Database
--------

.. note::
  The discussion below assumes the reader has prerequisite knowledge of MySQL and how to perform PKI user authentication (if required), secure data storage, and secure data backups.

Several ASD checks address the management of data storage. It is important to understand how to configure MySQL in accordance with local security requirements, such as the Oracle MySQL 8.0 STIG. Ideally, your organization will provision MySQL instances from a hardened cloud subscription that requires a smaller set of customer-responsible security settings.

Logging and Analysis
-----------------------

Many ASD checks specify requirements for how application log entries should collected, aggregated, managed, audited, and analysed. The STIG Manager application role in this is simple: it outputs all its log entries to STDOUT.  These log entries must be captured and retained in accordance with your log retention policy.  The developers of the STIG Manager API component have made efforts to ensure that the logs the application emits conform to requirements specified in the ASD where appropriate. However, there are several other components of a successful deployment that will produce logs that may also require management by your logging solution, such as the OIDC Provider, Database, and Container Platform.  

Transport Layer Security 
---------------------------

The ASD specifies the use use of TLS-secured connections to the application.  To meet this requirement, we strongly encourage deploying application components behind a reverse proxy that provides this capability. The reverse proxy should be able to handle many ASD requirements, such as TLS authentication, use of DoD Common Access Cards (CAC), and TLS encryption for the API, Web Client, and OIDC Provider.

Security Updates, Advisories, and Policies
---------------------------------------------

The ASD requires application deployment representatives to be aware of application updates, advisories, processes, and policies.  The project's Security Policy and Security Advisories can be found on the `Security page of our GitHub site. <https://github.com/NUWCDIVNPT/stig-manager/security>`_  We encourage you to acquaint yourself with our published Security Policy, subscribe for notifications of new releases, and report any vulnerabilities you may find on your own in a responsible way. 



Assessing Your Deployment
=============================

The documentation and artifacts provided here are intended to help teams that are deploying STIG Manager in an environment that is subject to the Application Security and Development STIG.  Below, you can find a summary and STIG information, `including a .ckl <https://github.com/NUWCDIVNPT/stig-manager/blob/main/docs/STIG-Manager-OSS.ckl>`_, relevant to this effort. 

Where applicable, we have self-evaluated portions of the ASD **as if** we were developer members of a deployed application's team. For most deployments, though, we are NOT part of your team and therefore the checks covering development practices might be properly evaluated as not applicable. Even in this case, however, we hope our self-evaluation provides useful insight into how the Project integrates security into our practice.

API and Web Client
------------------

About a third of the checks in the ASD assess application components provided by this Project - the API and Web Client. These checks assess both their behavior and how they are developed. All other checks are dependent on specific deployment configurations, but we have provided some guidance where we can.


.. warning::
  You must evaluate your deployment independently in accordance with your individual security requirements. Our self-evaluation CANNOT and DOES NOT represent a valid assessment of your deployment!


It is always possible to configure your deployment into an insecure state. 
The provided assessments may not apply to the way you have configured your deployment! They are to be used only as a guide or as reference for your own assessments.  In general, we have followed this convention when providing assessments:

  - Reviews are marked **Not a Finding** if they are considered by the STIGMan team to be compliant with the ASD by nature of the design and practices executed by the developers. 

  - Reviews are marked **Not Applicable** only if the project design meets conditions provided in rule guidance. It is always possible that your deployment configuration makes that particular STIG check "applicable."

  - Reviews marked **Informational** or **Not Reviewed** may have useful details to be used as reference for assessments but cannot be satisfied by the project application alone. 

The results displayed in the table below are also available as a `.ckl file in our GitHub repo <https://github.com/NUWCDIVNPT/stig-manager/blob/main/docs/STIG-Manager-OSS.ckl>`_, suitable for importing into STIG Manager. 


.. csv-table:: Application Security and Development STIG Self Assessment
  :file: stigman-asd-full.csv
  :widths: 10, 25, 10, 25 
  :header-rows: 1
  :stub-columns: 1
  :align: left
  :class: tight-table




