.. _related-repos-doc:


Related Repositories
#############################################################

`The STIG Manager OSS API is designed and documented such that additional clients can be developed to enhance its utility for users. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_

The STIG Manager OSS project provides the main reference UI Client, described in this documentation, as part of the main repository on GitHub.

If other projects want to contribute a client or other stand-alone enhancements to the tool, create a Pull Request and we will link to them here.



STIGMan Watcher
===========================

The STIG Manager Watcher utility is separately maintained by a member of the NUWCDIVNPT STIG Manager team, and serves as the reference Command Line Utility. It is a Node.js app that will monitor a specific folder for .ckl or XCCDF .xml files and automatically import them into a designated Collection. 

See the `STIGMan Watcher Repo <https://github.com/NUWCDIVNPT/stigman-watcher>`_ for more details. 


STIGMan Orchestration
===========================

The STIG Manager Demonstration Orchestration offers a sample configuration for a deployment of STIG Manager that offers CAC-Authentication with an nginx reverse proxy, as well as pre-configured Keycloak OIDC Authentication and MySql Database containers. 


See the `STIGMan Orchestration <https://github.com/NUWCDIVNPT/stigman-orchestration>`_ for more details. 


STIGMan Client Modules
==================================================

The STIG Manager team maintains a separate repository containing useful javascript modules for developing clients.  These modules are used in both the STIG Manager GUI and STIGMan Watcher, and are provided as a resource to assist the creation of clients that import checklist files or batch updates to the API. 

These modules are available `in the stig-manager-client-modules repository. <https://github.com/NUWCDIVNPT/stig-manager-client-modules>`_  Check the gitHub repo's README.md and documentation for more specific information about using them.

 - `ReviewParser.js` Provides parsers for .ckl, .cklb, and XCCDF data.  These modules will process data in the checklist format specified, and return a JSON object that can be used to create or update Assets, STIG Assignments, and Reviews in the STIG Manager API. The parsers incorporate processing that will ensure Reviews conform to the Import Options specified by the target Collections in the API, if specified.  
    - reviewsFromCkl
    - reviewsFromCklb
    - reviewsFromXccdf
 - `TaskObject.js` Takes parsed checklist data, as well as the current state of a Collection's Assets and the STIGs available in the system, and create a TaskObject. The TaskObject defines Assets and Assignments that need to be created or updated, as well as the Reviews that were identified in the parsed checklist data for those Assets.


