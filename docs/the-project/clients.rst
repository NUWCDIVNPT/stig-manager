.. _clients:


Clients
#############################################################

The STIG Manager project consists of an API and a UI. `The API is designed so that other contributors can create Clients, GUI or CLI, to take advantage of and expand on its capabilities. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_


Provided Clients
======================================

STIG Manager OSS Reference GUI
---------------------------------
A GUI client that makes use of the Project API is available in our Repo.  Its features are described elsewhere in this documentation. 

See the client `README.md <https://github.com/NUWCDIVNPT/stig-manager/tree/main/client/README.md>`_ for more information on developing or building the client.



STIG Manager Watcher
-------------------------
A command-line client that will monitor a file-system directory and upload .ckl/.cklb or XCCDF results to a STIG Manager API instance: `STIG Manger Watcher. <https://github.com/NUWCDIVNPT/stigman-watcher>`_  It is maintained by the main STIGMan OSS dev group, and also available as `an npm package. <https://www.npmjs.com/package/stigman-watcher>`_  Check the gitHub repo's `wiki for further documentation. <https://github.com/NUWCDIVNPT/stigman-watcher/wiki>`_

Proposed Clients
====================
Several additional Clients may be found useful, but are not a priority for development by the STIG Manager OSS team at this time. Some potential ideas for these clients:

    - A utility that checks for and fetches new STIGs from `DISA <https://public.cyber.mil/stigs/downloads/>`_ and imports them into STIG Manager. 
    - A utility to fetch and email regular reports to certain Users. 
    - A utility to facilitate some data exchange with the eMASS API directly, rather than have to use .ckl files as the mode of exchange. 
    - Analytics   
    - Tools to update STIG Assessments based on published CVEs that affect appropriate controls
    - Utility to import from an HBSS instance for STIG Evaluations



Create a new Client for the STIG Manager API
==================================================

The STIG Manager API was created so that other clients could take advantage of the data it manages. `The API is fully defined using the OpenAPI 3.0.1 specification here. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ 

Clients will need to authenticate with the OpenID Connect Identity provider their target API is configured to use.  Particular authentication flows and configurations supported may vary by deployment. 


Client Development Resources
==================================================

The STIG Manager team maintains a separate repository containing useful javascript modules for developing clients.  These modules are used in both the STIG Manager GUI and STIGMan Watcher, and are provided as a resource to assist the creation of clients that import checklist files or batch updates to the API. 

These modules are available `in the stig-manager-client-modules repository. <https://github.com/NUWCDIVNPT/stig-manager-client-modules>`_  Check the gitHub repo's README.md and documentation for more specific information about using them.

 - `ReviewParser.js` Provides parsers for .ckl, .cklb, and XCCDF data.  These modules will process data in the checklist format specified, and return a JSON object that can be used to create or update Assets, STIG Assignments, and Reviews in the STIG Manager API. The parsers incorporate processing that will ensure Reviews conform to the Import Options specified by the target Collections in the API, if specified.  
    - reviewsFromCkl
    - reviewsFromCklb
    - reviewsFromXccdf
 - `TaskObject.js` Takes parsed checklist data, as well as the current state of a Collection's Assets and the STIGs available in the system, and create a TaskObject. The TaskObject defines Assets and Assignments that need to be created or updated, as well as the Reviews that were identified in the parsed checklist data for those Assets.

