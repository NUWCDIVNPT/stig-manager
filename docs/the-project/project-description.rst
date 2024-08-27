.. _project-description:


Project Description and Resources
########################################


This document describes the purpose, requirements, deliverables, artifacts, tools, resources, and technologies that contribute to the STIG Manager Project. 
All project materials, including this document, are available from the `Project Repository on GitHub. <https://github.com/NUWCDIVNPT/stig-manager>`__ 

Purpose
=====================

STIG Manager is an Open Source API and Web app for managing the assessment of Information Systems for compliance with security checklists published by the United States (U.S.) Defense Information Systems Agency (DISA).  STIG Manager supports the RMF process by managing STIG assessments throughout the lifecycle of a system. Data owners can expose assessment data using role-based access controls and track the progress of their assessment teams. By serving as the single source of truth about Assets, STIGs, and their current assessment status, STIG Manager enables an efficient and auditable RMF Process.  

The STIG Manager OSS Project is developed under a DoD initiative to create and maintain cloud-ready Open Source software with a fully-defined API, reference clients, documentation, and other needed resources. 

All source code and materials are tracked and available on GitHub in the Project Repository.  The Project repository is the authoritative source for all project materials.  All project materials are licensed under the `MIT License <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__, with the exception of the client, which is licensed under the `GNU GPL v3 <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__.

The Project maintainers and contributors comply with the policies specified in the `Project's CONTRIBUTING.md document and the Developer's Certificate of Origin (DCO). <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTING.md>`__

Project maintainers regularly engage and consult with the user community to solicit feedback, ensure the project is meeting the needs of the user community, and develop ideas for future feature development.


Assets and Resources Maintained
===================================


**Deliverable Artifacts:**

- OpenAPI 3.1 Specification

  - Fully defined OpenAPI 3.1 Specification 
  - Fully defined to validate both request and response objects
  - Appropriate scopes and endpoint security definitions

- Web Application 

  - Reference UI client making significant use of API endpoints
  - STIG Manager: https://github.com/NUWCDIVNPT/stig-manager

- Command Line Utilities

  - Reference CLI client for automating .ckl or XCCDF imports
  - STIGMan Watcher: https://github.com/NUWCDIVNPT/stigman-watcher

- Containers

  - Docker Hub: https://hub.docker.com/u/nuwcdivnpt
  - Iron Bank: https://repo1.dso.mil/dsop/opensource/stig-manager

- Executables

  - STIG Manager: https://github.com/NUWCDIVNPT/stig-manager
  - STIGMan Watcher: https://github.com/NUWCDIVNPT/stigman-watcher

- Sample Orchestration

  - STIG Manager Demonstration Orchestration: https://github.com/NUWCDIVNPT/stigman-orchestration

- Documentation

  - Continuous Documentation updates included as part of Project Repository
  - Publicly hosted on ReadTheDocs: https://stig-manager.readthedocs.io/en/latest/the-project/project-description.html
  - Security Policy
  - Deployment guidance
  - Extensive deployment security and STIG assessment guidance to assist in ATO process.
  - User Guides and Tutorials on YouTube

		
**Automated Workflows**

- Comprehensive API endpoint testing spanning all user grants and privileges
- API response validation testing
- Automated delivery to Docker, Iron Bank, and other platforms
- Security scanning


**Comprehensive Documentation and User Guide Materials**

- Public Documentation website: https://stig-manager.readthedocs.io
- Tutorial videos on Youtube: https://www.youtube.com/@stigmanager8057/videos

**Deployment and Developer Resources**

- Sample orchestration demonstrating functionality with DoD CAC, reverse proxy, Keycloak realm
- Sample command-line client utilities

**Management and Engagement on Flank Speed Teams**

- Weekly Office Hours open to all interested parties
- User/Deployer queries	in Help channel
- Release Announcements



Products, Systems, Tools and Methods Used
=================================================

**Languages and Frameworks**

-  Javascript
-  NodeJS
-  Express
-  ExtJS 3.4+
-  Sphinx Document Generation


**Database**

-  MySQL


**Operating Systems and Environments**

-  Linux
-  Docker
-  Open Container Initiative (OCI) Images
-  Cloud-Ready Container Images and Deployment Options


**Commercial Off the Shelf Products, Standards, Processes, and Knowledge Areas**

-  GitHub
-  GitHub Codespaces
-  GitHub Actions
-  Docker
-  Docker Compose
-  Keycloak
-  OAuth 2.0
-  OIDC
-  OpenAPI 3.0+
-  Azure
-  Keycloak
-  Postman
-  DoD Iron Bank
-  npm
-  git
-  ReStructured Text
-  JSON Structured Logging
-  ReadTheDocs
-  Visual Studio Code
-  XCCDF
-  STIG Viewer features 
-  STIG Viewer .ckl format
-  RMF Process and requirements
-  API First development
-  Agile Development
-  code.mil guidelines
-  code.gov guidelines
-  DoD Software Development and Open Source Software guidelines
-  18F Open Source Policy guidelines
-  DoD Enterprise DevSecOps Reference Design (2022) guidelines
-  Application Security and Development STIG








