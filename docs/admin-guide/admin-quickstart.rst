.. _admin-quickstart:


STIGMan Application Manager (Administrator) Walkthrough
########################################################################


This Application Manager Walkthrough will walk you through typical responsibilities for a STIG Manager User with the App Manager role (often called "admin" for short and labeled that way in Keycloak). This Walkthrough assumes you are familiar with the terms and features specified in the :ref:`user-guide-doc`.
Beyond the permissions granted to normal Users, App Managers have the ability to:

   * Update STIG Benchmarks in STIG Manager
   * Alter Collections to which they have not been specifically granted access
   * Alter User Grants
   * Export and Import Application Data (Experimental feature for now.)


**The most important responsibility of the Application Manager is importing and updating the set of STIGs the system will use to calculate statistics, assign to Assets, populate the Library, and reference in all other functions.  This should be done quarterly, with the release of new STIG Library Compilations,  or individually as new STIGs are released.**

This update is quite simple, and is described below. 


Application Manager Menu
============================

App Managers in STIG Manager have access to 4 additional App Management tabs that other users do not, accessible from the Navigation Tree.


.. _stig-import:
.. _stig-updates:

STIG Benchmarks
============================


This tab shows you a list of STIGs known to this instance of STIG Manager along with some basic statistics about them, such as their rule count and revision date. This interface also allows you to import new STIGs. 

.. rubric:: Importing and Updating STIGs

DISA releases new versions of many of their STIGs every Quarter.  They also occasionally release them off this schedule. Keep an eye on DISA's  `https://public.cyber.mil/stigs/ <https://public.cyber.mil/stigs/>`_ and `https://cyber.mil/stigs/ <https://cyber.mil/stigs/>`_ sites for updates. 

These updates must be brought into STIG Manager if you wish the updates to be reflected in STIG Manager's reports and presentation. STIGs must be imported by someone with Application Manager privileges in the STIG Manager instance:

#. Download the STIGs you want to update from `DISA. <https://public.cyber.mil/stigs/>`_
#. Upload the .zip files to STIG Manager via "Import STIGs" button in the ``Application Management -> STIG Benchmarks`` workspace accessed via the Navigation Tree. By default, if the file contains a STIG Revision that already exists in the STIG Manager system, STIG Manager will retain the existing revision. To overwrite existing revisions, select the "Replace existing Revisions" checkbox when importing.
#. The import may run for several minutes. When finished, the workspace will be populated with the STIG IDs and other information about the STIGs you imported.  These STIGs will now be available to users to assign to their Assets and for evaluations.

.. note::
  You can import entire .zip archives of the Quarterly Library Compilations at once, or individual STIGs. 

.. thumbnail:: /assets/images/admin-stigs.png
   :width: 50% 
   :show_caption: True
   :alt: STIG Management
   :title: STIG Management

|

.. ATTENTION::
   **STIG Manager OSS will not be able to function as intended if you have not imported STIGs into the system.** The STIGs you import should be the ones published by DISA, as they will be used as the reference STIG for almost all STIG Manager functions.  STIGs must be imported before any Asset-STIG assignments can be made, manual evaluations performed, or .ckl files can be imported. All statistics are calculated against the latest (default) version of the STIG.



By default, STIG Manager displays Checklists and Reviews according to the latest version of the STIG.  It will also recalculate statistics against the latest version(s) of the STIGs. No other action is needed after an update. When a new STIG is imported from this interface, ALL assets in the system will reflect new version of the imported STIG as the default. Older revisions of STIGs can still be selected from the Review or Collection Review Workspace checklist pulldown menu. 


.. thumbnail:: /assets/images/asset-review-stig-revisions.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection

|


STIG Manager tracks Reviews by their Rule Version (often called "STIG ID") and that Rule's Check Content. In most cases, new STIG revisions will have substantially the same rule content as previous revisions. This means that most of the time, when you update Reference STIGs in STIG Manager, most Assets will carry most of their existing reviews forward and you will not have to start from scratch.

.. _stig-delete:

Delete Stigs or Revisions
-------------------------------

Many STIGs are released quarterly, and old STIGs quickly lose their relevance.  To keep a handle on Database growth and simplify the user experience, you may want to delete old STIG revisions. We have found it is not especially useful to keep STIGs greater than 1 revision away from the current one around, as they are no longer valid for most purposes. 

You might also delete a STIG revision if you have updated STIGs but would prefer to revert to an older one as the default (hopefully not for long!).  In this case, you might want to delete the current STIG revision.  

.. warning::
      When you delete a STIG or a specific STIG revision, Reviews for rules **that only appear in that revision** will be deleted. If the rules in that STIG are found in other STIGs or revisions, the reviews will remain.


|




Collections Tab
============================

This tab presents a list of all Collections in STIG Manager, as well as some statistics about the Collection.  It also includes buttons to create, delete, and alter Collection properties and grants. 

In most cases, Collection Owners should be administering their own Collections. However, in cases where the Owner is unavailable, or has accidentally removed all owners from a Collection, this interface allows an App Manager to assign new Owner Grants to Collections by double-clicking the Collection or using the "Collection Properties" button. The App Manager can also delete Collections if required.

.. thumbnail:: /assets/images/admin-collections.png
   :width: 50% 
   :show_caption: True
   :alt: Collection Admin
   :title: Collection Admin


----------------------------------

.. _pre-registering-users:

User Grants
============================

This tab presents a lit of all users known to STIG Manager, as well as some statistics about them. 
It also includes buttons to pre-register User, unregister User, and modify User Grants. 


.. ATTENTION::
   Being an App Manager in STIG Manager does not give you the ability to *create* new users or assign them new Application Privileges (Admin or Collection Creator). Creating users and assigning Application Privileges can only be done in the Authentication provider (often the Keycloak Management Console), and you must have the proper permissions on your Authentication Provider to do this.

Pre-registering Users
----------------------------

STIG Manager will automatically creates a user record when a new Authenticated User accesses the system.  If you want to make assignments to users before they have accessed the system, it is possible to pre-register them from the ``Administration -> User Grants`` workspace.  Click the Pre-register User button, and enter their username. This username must match exactly the username that will be provided by the Authentication Provider when the user eventually shows up. 

It is important to note that the pre-register function does not grant access to STIG Manager. User *access* is solely managed via your Authentication Provider (Keycloak, Okta, etc). Pre-registering a user in STIG Manager will create a user record in the STIG Manager database that can be given Collection Grants before the user has accessed the system, but they will not be able to access the system until they have authenticated with the Authentication Provider.

A pre-registered user will have *No value* in the Last Access column of this screen until they actually access STIG Manager. 


.. thumbnail:: /assets/images/user-admin-prereg-button.png
      :width: 50% 
      :show_caption: True
      :title: Pre-register User button

.. thumbnail:: /assets/images/user-admin-prereg-popup.png
      :width: 50% 
      :show_caption: True
      :title: Pre-register User popup

|

.. _deregistering-users:
.. _unregistering-users:
.. _delete-user:


Unregistering Users
--------------------------

Overall access to STIG Manager is controlled by your deployment's OIDC Provider (ie. Keycloak).  Unregistering Users will remove all their Collection Grants, but will not prevent access to STIG Manager unless the user is also disabled/deleted/altered in the Authentication Provider.  However, once un-registered they will not have access to any information in STIG Manager besides the STIG Library. 

To unregister a User, select the User, and click the "Unregister User" button. The selected user will have all their Collection Grants removed.  The User's other info will remain, so that any reviews or other actions they have performed will continue to have attribution. 


.. note::
      If you want to prevent a user from having any access at all to STIG Manager, you must contact your OIDC Provider POC and ask that they perform this action. This can be accomplished in different ways that will depend on your specific deployment. 


Modifying Users
-----------------------

The only changes that can be made to Users in the STIG Manager interface is their Collection Grants or Group Membership. All other data in the User pop-up is derived from information in the access token, which is managed in the Authentication Provider.

.. thumbnail:: /assets/images/userAdmin.png
   :width: 50% 
   :show_caption: True
   :alt: User Admin
   :title: User Admin


-------------------------------

.. _service-jobs:

Service Jobs
============================

The Service Jobs feature provides a framework for managing scheduled background operations in STIG Manager. This feature enables both system-defined and user-defined jobs that can run one or more predefined tasks either on a schedule or immediately on demand.

The initial implementation provides database maintenance and cleanup tasks. However, Service Jobs will serve as the foundation for future capabilities, including Review aging operations and time-based snapshots and analysis.

.. note::
   Service Jobs require administrative privileges to access and manage. Regular users do not have visibility into the Service Jobs interface.

.. note::
   The database maintenance Jobs are not enabled by default. Administrators must enable the Jobs they wish to use. 

.. warning::
   Exercise caution when modifying or running database maintenance jobs, as these operations can affect system data. Always ensure you have appropriate backups before running destructive maintenance operations.

.. rubric:: Accessing Service Jobs

The Service Jobs interface is accessible from the ``Application Management -> Service Jobs`` workspace in the Navigation Tree. This interface provides App Managers with tools to view, create, modify, and monitor jobs and their execution history.

.. rubric:: Job Types

**System Jobs**
   Pre-defined jobs created and maintained by STIG Manager for essential database operations. System jobs cannot be deleted and have restricted modification permissions - only their scheduling (event) properties can be modified by administrators.

**User Jobs**  
   Custom jobs created by App Managers to meet specific organizational needs. User jobs provide full flexibility in task selection, scheduling, and configuration.

.. rubric:: Job Components

Each job consists of the following components:

**Tasks**
   Individual operations that perform specific functions. Tasks are pre-defined by the system and can include database maintenance operations, cleanup procedures, and analytical functions. Multiple tasks can be assigned to a single job.

**Schedule (Event)**
   Optional scheduling configuration that determines when and how frequently a job runs:
   
   * **One-time**: Executes at a specific date and time
   * **Recurring**: Executes on a repeating schedule with configurable intervals (daily, weekly, monthly, etc.)
   * **Manual**: No schedule - runs only when triggered manually

**Job Properties**
   Basic job information including name, description, creator, and modification history.

.. rubric:: Managing Jobs

**Creating Jobs**
   Use the "Create" button to define new user jobs. Specify the job name, description, select one or more tasks, and optionally configure a schedule.

**Modifying Jobs**
   Existing jobs can be modified using the "Modify" button. User jobs allow full modification of all properties, while system jobs only permit schedule modifications.

**Running Jobs Immediately**
   Any job can be executed immediately using the "Run now..." button, regardless of its scheduled configuration.

**Removing Jobs**
   User jobs can be deleted using the "Remove" button. System jobs cannot be deleted.

.. rubric:: Monitoring Job Execution

The Service Jobs interface provides detailed execution monitoring:

**Job Runs**
   View complete execution history with run states (running, completed, failed, shutdown), start times, duration, and detailed output logs.

**Real-time Output**
   Monitor job execution in real-time with detailed task-level output including timestamps, message types, and execution status.

**Run Management**
   Individual job runs can be deleted from the execution history as needed for maintenance purposes.

.. rubric:: Available Tasks

The system provides various pre-defined tasks for common maintenance operations:

* **WipeDeletedObjects**: Removes soft-deleted records from the database
* **DeleteUnmappedReviews**: Cleans up reviews that are no longer mapped to current STIG requirements
* **DeleteUnmappedAssetReviews**: Removes unmapped reviews specific to individual assets

Additional tasks may be available depending on your STIG Manager configuration and version.

.. _automated-imports:

Configure a Source of Automated Evaluations
==================================================

There are several tools available that will automatically assess many of your STIGs, and provide output in .ckl or XCCDF output.  Tools such as Evaluate STIG and SCC can be configured to populate file system folders with their evaluation results. If you find yourself with a lot of these .ckl files, you may find the STIGMan Watcher tool useful.  

STIGMan Watcher is a lightweight command line utility that can be configured to monitor a file system folder for .ckl files or XCCDF results, and automatically submit them to a Collection on a STIG Manager instance.  You could potentially have many STIGMan Watchers running, each monitoring a file folder and importing results into particular STIGMan Collections. 

More information can be found along with the source code on `GitHub <https://github.com/NUWCDIVNPT/stigman-watcher>`_ and with the `NodeJs package. <https://www.npmjs.com/package/stigman-watcher>`_


.. note::
   Be sure to give the STIGMan Watcher user permissions on your Collection!
