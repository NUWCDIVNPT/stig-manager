.. _contributing:


Contribution Guide
########################################


Reporting Bugs & Issues
=============================

Please file bug reports or feature requests on the `STIG Manager 
issue tracker <https://github.com/NUWCDIVNPT/stig-manager/issues>`__. When reporting a bug, please provide as much detail as possible to help us understand and reproduce the issue. Include:

-  Install type: Hosted, Local, Docker, etc
-  Detailed steps to reproduce the issue
-  Action taken
-  Expected result
-  Actual result
-  Screenshots or logs (if relevant)
-  Your environment details (OS, browser version, etc.)


Code Contributions
======================================

STIG Manager is being developed using a `Forking Workflow <https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow>`_. All contributions to the codebase are expected to come via a GitHub Pull Request(PR) from a fork of the appropriate repository. 

Contributors should be comfortable with the `licences <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__ governing the project and any other conditions specified in the Project's `Contributing.md <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTING.md>`_ document.

To ensure smooth integration and maintain project quality, please adhere to these guidelines:

1. **Reference an Issue**: 

   - Every PR should reference an existing issue in the repository. 
   - If no relevant issue exists, create one describing the bug or feature you intend to address before submitting your PR.

2. **Testing**: 

   - PRs should pass all existing tests.
   - Provide additional tests for new features or bug fixes when applicable.
   - If automated tests aren't suitable, include a clear testing procedure in your PR description.

3. **First-time Contributors**:

   - Add yourself to the `CONTRIBUTORS.md <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTORS.md>`_ file.
   - By doing so, you agree to abide by the Developer's Certificate of Origin as outlined in `CONTRIBUTING.md <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTING.md>`_.
   - A project maintainer will send an email to the address you provided in CONTRIBUTORS.md. You must respond to this email before your PR can be accepted.

4. **Code Quality**:

   - Follow the project's coding style and conventions.
   - Write clear, self-documenting code with appropriate comments.
   - Keep commits focused and use meaningful commit messages.

5. **Documentation**:

   - Update relevant documentation to reflect your changes.
   - Include inline documentation for new code when necessary.

6. **Review Process**:

   - Be responsive to review comments and change requests.
   - Make requested changes promptly or provide a clear explanation if you disagree.

7. **PR Branch Permissions**:

   - When creating a PR, enable the "Allow edits from maintainers" option. This gives project maintainers the ability to make updates to your PR if needed.   

8. **Licensing**:

   - Ensure your contributions comply with the project's `licenses <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`_.

PRs that meet these criteria will be reviewed by project maintainers. Upon successful review and email verification, contributions will be merged into the main branch.

Before contributing, please familiarize yourself with the project structure, coding standards, and development environment setup. If you have any questions or need clarification on any aspect of the contribution process, please open a discussion in the project's  `GitHub Discussions <https://github.com/NUWCDIVNPT/stig-manager/discussions>`_ area.

We appreciate your interest in contributing to STIG Manager and look forward to your contributions!


Development functional components
======================================

This section outlines the main components of the STIG Manager project, their technologies, and current maintainers. We welcome contributions in all these areas. If you would like to contribute, check our  `Issues on GitHub <https://github.com/NUWCDIVNPT/stig-manager/issues>`__ for items labeled `good first issue <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22>`__, or for specific areas you would like to help with. 


.. list-table:: **API**
   :widths: 20 20 10 40 10
   :header-rows: 1
   :class: tight-table

   * - Component
     - Technology
     - Maintainers
     - Roadmap Goals
     - GitHub Label(s)
   * - API definition
     - OpenAPI 3.0
     - @csmig
     - - Refine API Definition to enable automated validation of API responses. 
       - Update to OpenAPI Spec 3.1 when suitable middleware support is available. 
     - `OAS <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aissue+is%3Aopen+label%3AOAS>`__
   * - Express middleware
     - | Node.js
       | Express
     - @csmig
     - - Identify suitable middleware replacement for oas-tools, which does not seem well supported at the moment, and includes unneeded dependencies. 
     - | `API <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3AAPI>`__
       | `dependencies <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Adependencies>`__
   * - MySQL service
     - | Node.js
       | MySQL 8
     - @csmig
     - - Keep in sync with MSSQL Server service, which is the primary development focus at the moment. 
     - | `DB <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3ADB>`__
       | `API <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3AAPI>`__
   * - Microsoft SQL Server service
     - | Node.js
       | MSSQL 2019
     - @csmig
     - - Implementation of MS SQL Server service to match or exceed current MySQL feature support.
     - | `DB <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3ADB>`__
       | `API <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3AAPI>`__
   * - Test suites
     - | Mocha
       | Chai
       | Chai-http
     - @cd-rite
     - - Automated UI Testing
       - Help would be appreciated identifying additional test cases. 
     - `tests <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Atests>`__
   * - CI/CD pipelines
     - | GitHub Actions
       | Docker
     - | @cd-rite
       | @csmig
     - - Integration of additional automated security scanning. 
     - `workflow <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Aworkflow>`__
   * - Documentation
     - | Python
       | sphinx
     - @cd-rite
     - - Addition and integration of JSDoc notation to code and documentation. 
     - `documentation <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Adocumentation>`__

     

.. list-table:: **Clients**
   :widths: 20 20 10 40 10
   :header-rows: 1
   :class: tight-table

   * - Component
     - Technology
     - Maintainers
     - Goals
     - GitHub Label(s)
   * - NAVSEA single-page web app
     - ExtJS 3.4
     - @csmig
     - - Additional reports and analytical presentations of STIGMan data.
     - `UI <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3AUI>`__     
   * - `STIGMAN Watcher <https://github.com/NUWCDIVNPT/stigman-watcher>`__
     - | Node.js
     - @csmig
     - - Report of logged Watcher actions.
     - `Issues <https://github.com/NUWCDIVNPT/stigman-watcher/issues>`__     
   * - Documentation
     - | Python
       | sphinx
     - | @cd-rite
       | @csmig
     - - There is always more documentation to write. 
     - `documentation <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Adocumentation>`__     
   * - Integration with other services
     - Varied
     - | @cd-rite
       | @csmig
     - - Integrations with other services to enhance functionality, such as blob storage services for artifact storage, or Machine Learning for automated review approvals. 
     - `enhancement <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement>`__          


Data Flow Diagram
---------------------------

.. thumbnail:: /assets/images/data-flow-01b.svg
  :width: 75%
  :show_caption: True 
  :title: Data Flow Diagram


Required Tools
-----------------

The team regularly uses these tools:

  - git: For version control
  - Docker: For containerization and testing
  - VS Code: Recommended IDE for development
  - Node.js: For running the application and tests
  - Mocha, Chai, Chai-http: For writing and running tests


Software Components
-----------------------

See :ref:`requirements-and-dependencies` and :ref:`project-description` for more information about project components and dependencies.


Licenses
-----------------

The repository is licensed under the `MIT License <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__, with the exception of the client, which is licensed under the `GNU GPL
v3 <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__.

