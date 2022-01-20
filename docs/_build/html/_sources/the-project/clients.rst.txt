.. _clients:


STIG Manager Clients
#############################################################

The STIG Manager project consists of an API and a UI. `The API is designed so that other contributors can create Clients, GUI or CLI, to take advantage of and expand on its capabilities. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_


Provided Clients
======================================

STIG Manager OSS Refernce GUI
---------------------------------
A GUI client that makes use of the Project API is available in our Repo.  Its features are described elsewhere in this documentation. 


STIG Manager Watcher
-------------------------
A command-line client that will monitor a file-system directory and upload .ckls or SCAP results to a STIG Manager API instance: `STIG Manger Watcher. <https://github.com/NUWCDIVNPT/stigman-watcher>`_  It is maintained by the main STIGMan OSS dev group, and also available as `an npm package. <https://www.npmjs.com/package/stigman-watcher>`_  Check the gitHub repo's `wiki for further documentation. <https://github.com/NUWCDIVNPT/stigman-watcher/wiki>`_

Proposed Clients
====================
Several additional Clients may be found useful, but are not a priority for development by the STIG Manager OSS team at this time. Some potential ideas for these clients:

    - A utility that checks for and fetches new STIGs from `DISA <https://public.cyber.mil/stigs/downloads/>`_ and imports them into STIG Manager. 
    - Some sort of STIG Browser, which could allow users to peruse the STIG Manager STIG and SCAP libraries without having to assign STIGs to an Asset in a Collection.
    - A utility to fetch and email regular reports to certain Users. 
    - A utility to facilitate some data exchange with the eMASS API directly, rather than have to use .ckl files as the mode of exchange. 
    - Analytics   
    - Tools to update STIG Assessments based on published CVEs that affect appropriate controls
    - Utility to import from an HBSS instance for STIG Evaluations



Create a new Client for the STIG Manager API
==================================================

STIG Manager API was created so that other clients could take advantage of the data it manages, though currently, the only one available is the Client provided as part of the project repo.

For now, please use our existing Clients as a reference for how to do this.  If more information is required, please let us know in an Issue on our Repo and we will do our best to assist.


