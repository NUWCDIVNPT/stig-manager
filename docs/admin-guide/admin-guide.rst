.. _admin-guide-doc:


STIGMan Application Management Guide 
###############################################

STIGMan App Manager Guide
==================================

Lists functionality available to App Managers (often called "admins" for short) in the STIG Manager app.  For information about administering a deployment of STIG Manager, please see :ref:`installation-and-setup-index`.

Navigation Tree
--------------------
App Managers will see the Application Management branch in the Navigation tree, as well as the Collections branch available to all users.

.. index::
   single: Administration Branch

.. _Administration Branch:

Application Management Branch
==================================
The Application Management branch provides access to the following Application Management panels. 

Collections Admin Panel
--------------------------------
This Panel lists every Collection in the STIGMan system, and allows you to create, delete, and alter them with the buttons at the top.
The columns list the Collection Name, Description, Owners, total User members, total Assets, total assigned STIGs, and the date of creation.


.. note::
   Be sure to assign a new Collection an Owner, or no one except for App Managers will be able to see it!


.. thumbnail:: /assets/images/admin-collections.png
      :width: 50% 
      :show_caption: True
      :title: Collection Administration


----------------------

Users Admin Panel
---------------------------------
This Panel lists every User known to the STIGMan system. The columns display usernames, Display Name, Status, Groups, date of first User access, last User access, User's privileges ( Create Collection or Administrator), and their internal userid.

STIG Manager's Users are automatically created when they have successfully used your Authentication Provider to authenticate and are redirected back to the STIGMan application.

Users can be pre-registered before they have authenticated with your Authentication Provider, but the username must match exactly.

Users can be Unregistered from STIG Manager. If the User has never accessed the system, their User record will be deleted. If the User has accessed the system, the User's Grant and Group assignments will be removed, but their User record will be retained for auditing and attribution purposes. The User will still be able to access the system if granted access by the Authentication Provider.

Application Managers can change a User's Status by selecting the user, and clicking the "Set Un/Available" button in the toolbar. 

User Statuses:
  - **Available** - Default Status. Allows an authenticated User access to the system and allows them to be assigned Grants and Group memberships.
  - **Unavailable** - The User will not be able to access the system, and will not appear in User lists for the purposes of assigning Grants or Group membership. 

When an App Manager sets a User's Status to "Unavailable," all the User's existing Grants and Group memberships will be removed. The User's record will remain in the system for auditing and attribution purposes.

By default, the Users Admin panel enables a filter on the "Status" column, so that only "Available" Users are displayed. To view all Users, check the "(Select All)" box in the Status column filter.


.. thumbnail:: /assets/images/admin-users.png
      :width: 50% 
      :show_caption: True
      :title: Users Administration

|

User Properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Double-click on a User, or select a user and click the "Modify User..." button to view that User's Grants and other information. 
The pop-up will list the User's email address and other Info, as well as the User's Group Membership and Grants. The Direct Grants tab lists the Grants that have been specifically applied to the User, and the "Effective Grants" panel includes Collection Grants for Groups the User is a member of. The "Last Claims" tab displays the OIDC access token information received the last time the User accessed the application. 

.. thumbnail:: /assets/images/admin-user-properties.png
      :width: 50% 
      :show_caption: True
      :title: User Properties

|

User Groups Admin Panel
---------------------------------

This Panel lists the groups created in the STIGMan system. The columns display the Group Name, Description, Creation Date, the number of Users in the group, and the number of Collections the group has access to.

Only Application Managers can create or modify Groups and their User membership. Once a Group is created, it becomes available to all Collection Owners and Managers to be assigned Grants in their Collections. 


.. thumbnail:: /assets/images/admin-user-groups.png
      :width: 50% 
      :show_caption: True
      :title: User Groups Administration
      

Groups can be created, deleted, and modified with the buttons at the top of the panel. Users can be added to or removed from groups by double-clicking on the group, or selecting a group and clicking the "Modify Group..." button.

Change the Users in the group by selecting the User and clicking the arrow buttons to move them between the "Available Users" and "Group Members" lists. Once Group Members is populated with the desired Users, click the "Save" button to save the changes.


.. thumbnail:: /assets/images/admin-user-groups-popup.png
      :width: 50% 
      :show_caption: True
      :title: User Group Popup Window



STIG Benchmarks Admin Panel
-----------------------------------------
This panel lists every STIG that has been loaded into STIG Manager and allows App Managers to import new STIGs into STIG Manager.
The panel indicates the Benchmark ID, STIG Title, status, Current Revision, Revision Date, number of Rules, and number of potentially automated Rules for each STIG.

Use the buttons at the top to add new STIGS, delete entire STIGs or specific revisions. STIGs can be imported individually, or as a .zip library of many STIGs.

.. note::
      By default, if the imported file contains a STIG Revision that already exists in the STIG Manager system, STIG Manager will retain the existing revision. To overwrite existing revisions, select the "Replace existing Revisions" checkbox when importing.


.. thumbnail:: /assets/images/admin-stigs.png
      :width: 50% 
      :show_caption: True
      :title: STIGs Administration


.. note::
   STIG Manager only knows about the STIGs you have imported into the system. This action must be performed by App Managers, often quarterly to keep pace with DISA releases.  Once a new STIG revision is imported, that revision becomes the default STIG that is presented for Review to the User. Reviews for old STIGs still in the system can be viewed with the Checklist->Revisions menu item in the Asset Review workspace for that STIG.



-------------------------

.. _service-jobs:

Service Jobs Panel
------------------------------------

This panel allows App Managers to control and view the background Service Jobs that have been created in the STIGMan database. It includes information about the jobs, their schedule, component tasks, status, run history and output.  App Managers can create, modify, schedule, delete, and run jobs from this panel.  Jobs created by `system` cannot be deleted, but they can be disabled and their schedule can be modified. 

.. thumbnail:: /assets/images/admin-service-jobs.png
      :width: 75% 
      :show_caption: True
      :title: Service Jobs Administration

The Service Jobs feature provides a framework for managing scheduled background operations in STIG Manager. This feature enables both system-defined and user-defined jobs that can run one or more predefined tasks either on a schedule or immediately on demand.

The initial implementation provides database maintenance and cleanup tasks. However, Service Jobs will serve as the foundation for future capabilities, including Review aging operations and time-based snapshots and analysis.

.. rubric:: Job Types

**System Jobs**
   Pre-defined jobs created and maintained by STIG Manager for essential database operations. System jobs cannot be deleted and have restricted modification permissions - only their scheduling (event) properties can be modified by administrators.

**User Jobs**  
   Custom jobs created by App Managers to meet specific organizational needs. User jobs provide full flexibility in task selection, scheduling, and configuration.

The feature provides several built-in System Jobs that are disabled by default. It is highly recommended that you enable and schedule these jobs to maintain the health of your STIG Manager database. Scheduling these jobs to run during off-peak hours is advisable to minimize any potential performance impact on users and reduce resource usage.

System-provided Jobs:
 - **Cleanup Database**: Removes database records related to deleted Collections and Assets and their associated reviews. Disabled by default.
 - **Delete Unmapped Asset Reviews**: Delete reviews for rules in STIGs that are no longer assigned to an Asset.  This can occur when STIGs are unassigned from an Asset by a Collection Manager. Disabled by default.
 - **Delete Unmapped Reviews**: Delete reviews that no longer match any STIG Rule in the system. This can occur when old Reference STIGs are removed from the system by an App Manager. Disabled by default.


.. note::
   These database maintenance Jobs are not enabled by default. Administrators must enable the Jobs they wish to use. Exercise caution when modifying or running database maintenance jobs, as these operations can affect system data. Always ensure you have appropriate backups before running destructive maintenance operations.

.. rubric:: Job Components

Each job consists of the following components:

**Tasks**
   Individual operations that perform specific functions. Tasks are pre-defined by the system and can include database maintenance operations, cleanup procedures, and analytical functions. Multiple tasks can be assigned to a single job, and will be run sequentially.

   The system provides various pre-defined tasks for common maintenance operations. These tasks can be combined into jobs as needed:
   * **WipeDeletedObjects**: Removes soft-deleted records from the database
   * **DeleteUnmappedReviews**: Cleans up reviews that are no longer mapped to current STIG requirements
   * **DeleteUnmappedAssetReviews**: Removes unmapped reviews specific to individual assets
   * **AnalyzeReviewTables**: Runs the `ANALYZE TABLE` command on review-related database tables to optimize query performance   

**Schedule (Event)**
   Optional scheduling configuration that determines when and how frequently a job runs:
   
   * **One-time**: Executes at a specific date and time
   * **Recurring**: Executes on a repeating schedule with configurable intervals (daily, weekly, monthly, etc.)
   * **Manual**: No schedule - runs only when triggered manually

**Job Properties**
   Basic job information including name, description, creator, and modification history.


.. thumbnail:: /assets/images/admin-service-job-properties.png
      :width: 50% 
      :show_caption: True
      :title: Service Job Properties   

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
   Individual job runs can be deleted from the execution history as needed for maintenance purposes with the Trash button in the Job Run row.



-------------------------

.. _app-info:

Application Info Panel
------------------------------------


This panel provides App Managers with a report on the current state, performance, and utilization of the STIGMan application.  

The toolbar allows users to load and save report data files, as well as fetch a new report from the API. The "Save for sharing" button will download a .json file of the current report data with the option to replace specific deployment data such as Collection and User names with generated identifiers. 

The report displays the data source, date, and STIG Manager version at the top. Report data is displayed in the following tabs:

  - **Requests**: Information regarding the requests made to each API endpoint, organized by operationId. This data includes the count of requests, max duration, average duration, response length, error counts, and other useful metrics.  Endpoints with ``projection`` parameters will populate the "Projections" panel with a subset of these metrics. This report also indicates users and clients that made the requests, as well as counts of any error code responses.
  - **Collections**: High level metrics about the size and state of all Collections, including "disabled" Collections and Assets, total Reviews, grants, etc. This report offers additional tabs reporting Grants, Labels, STIG Assignments, and Settings by Collection. The "Access Control Lists" panel lists users and applicable access control rules for users with limited access to the Collection, such as those with Restricted-type grants. 
  - **Users**: A report of all users of the system, their privileges, grants, and last active date.  This report also includes panels summarizing overall user counts by privilege, and by last activity date (last 30/90 days).
  - **Groups**: A report of all User Groups in the system, their User count, grants, and creation date. 
  - **MySQL**: Information about the managed data, configuration, and status of the MySQL database. 
  - **NodeJs**: Information about the configuration of the STIGMan application, as well as status of the NodeJs server, including the version, uptime, and memory usage.
  - **JSON Tree** : A tree view of the data that is available in the report. Equivalent to the contents of the .json file that can be downloaded with the "Save" button.


.. note::
   Help the STIG Manager team improve the application by sharing this report if you encounter issues or have suggestions for improvement. You can email the report to the team at RMF_Tools@us.navy.mil


.. thumbnail:: /assets/images/admin-app-info.png
      :width: 50% 
      :show_caption: True
      :title: Application Info Report


|


-------------------------

.. _log-stream:

Log Stream Panel
------------------------------------


This panel provides App Managers with real-time streaming of log records from the STIG Manager backend to the web client. This can help troubleshoot issues that would otherwise require direct access to the backend logs. 
Log records are transmitted over a WebSocket connection, which requires a properly configured reverse proxy or firewall to allow WebSocket traffic. In compatible browsers, the stream can be recorded to a file for later analysis.

This feature is experimental, however it is enabled by default. It can be disabled by setting the ``STIGMAN_EXPERIMENTAL_LOGSTREAM`` environment variable to ``false``. 




-------------------------

.. _app-data:

Export/Import Data Panel
------------------------------------

This panel allows App Managers to stream JSONL records from the STIG Manager backend database to a file, with an option to GZip compress the stream. The final size of the file is unknown when the operation starts, so no progress indication can be provided. Transfer rates will be higher if the server does not compress the stream, but the final file may be up to 10x larger.

The downloaded file can be imported into the same or a different STIG Manager instance. All existing data will be overwritten. Importing a Gzip compressed file will reduce upload time and memory usage on the API service.

This feature must be enabled for the deployment by setting the ``STIGMAN_EXPERIMENTAL_APPDATA`` environment variable to ``true``. 

.. warning::
   This feature is Experimental and continues to be developed, breaking changes may happen. Use at your own risk and rely on daily database backups to maintain your data.  ALL data in the destination instance will be replaced.

.. thumbnail:: /assets/images/admin-app-data.png
      :width: 50% 
      :show_caption: True
      :title: Application Data Import/Export


|

