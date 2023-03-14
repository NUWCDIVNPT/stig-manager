.. _contributing:


Contribution Guide
########################################


Reporting Bugs & Issues
=============================

Please file bug reports on the `STIG Manager 
issue tracker <https://github.com/NUWCDIVNPT/stig-manager/issues>`__. When reporting
a bug, please include as much information as possible. This includes:

-  Install type: Hosted, Local, Docker, etc
-  Action taken
-  Expected result
-  Actual result
-  Screenshot (if relevant)


Developer Information
======================================

STIG Manager is being developed using a `Forking Workflow <https://www.atlassian.com/git/tutorials/comparing-workflows/forking-workflow>`_. All contributions to the codebase are expected to come via a GitHub Pull Request from a fork of the appropriate repository.  Ideally, PRs should reference an Issue, pass all existing tests, and provide additional tests if applicable.  Upon successful review, contributions will be merged into the main branch by the project maintainers.  

Contributors should be comfortable with the `licences <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__ governing the project and any other conditions specified in the Project's `Contributing.md <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTING.md>`_ document. On first PR submission, feel free to add yourself to the `Contributors <https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTORS.md>`_ document. 

Development functional components
======================================

These are the components of the project, their technologies and maintainers. We are soliciting individuals and organizations interesting in helping maintain any of these components.  If you would like to contribute, check our  `Issues on GitHub <https://github.com/NUWCDIVNPT/stig-manager/issues>`__ for items labeled `good first issue <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22>`__, or for specific areas you would like to help with. 



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
     - | Postman
       | newman
     - @cd-rite
     - - Automated UI Testing
       - Help would be appreciated identifying additional test cases. 
     - `tests <https://github.com/NUWCDIVNPT/stig-manager/issues?q=is%3Aopen+is%3Aissue+label%3Atests>`__
   * - CI/CD pipelines
     - | GitHub Actions
       | Docker
       | newman
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


|


Required Tools
----------------

The team regularly uses these tools:

    - git
    - Docker
    - VS Code
    - Postman



Software Components
-----------------------

See :ref:`requirements-and-dependencies`




License / Credits
-----------------

The repository is licensed under the `MIT License <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__, with the exception of the client, which is licensed under the `GNU GPL
v3 <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__.

