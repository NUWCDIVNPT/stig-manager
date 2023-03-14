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


