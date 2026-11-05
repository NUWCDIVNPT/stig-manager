.. _admin-guide-doc:


STIGMan Application Management Guide 
###############################################

STIGMan App Manager Guide
==================================

Lists functionality available to App Managers (often called "admins" for short) in the STIG Manager app.  For information about administering a deployment of STIG Manager, please see :ref:`installation-and-setup-index`.

Navigation Rail
--------------------
App Managers will see the Admin entry in the Nav Rail, in addition to the entries available to all users. The Admin section has its own navigation list on its left: Collections, Users, User Groups, STIG Benchmarks, Service Jobs, Application Info, Export/Import Data, and Log Stream. Most Admin pages show a grid with a toolbar, and a Properties pane on the right; select a row in the grid to view and edit it in the Properties pane.

.. index::
   single: Administration Branch

.. _Administration Branch:

Admin Section
==================================
The Admin section provides access to the following Admin pages.

Collections Page
--------------------------------
This page lists every Collection in the STIGMan system, and allows you to create and delete them with the buttons at the top. Select a Collection to alter its Name, Description, and Grants in the Properties pane.
The columns list the Collection Name, Description, Owners, total User members, total Assets, total assigned STIGs, and the date of creation.


.. note::
   Be sure to assign a new Collection an Owner, or no one except for App Managers will be able to see it!


.. thumbnail:: /assets/images/admin-collections.png
      :width: 50% 
      :show_caption: True
      :title: Collection Administration

.. thumbnail:: /assets/images/new/admin-collections.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Collection Administration


----------------------

Users Page
---------------------------------
This page lists every User known to the STIGMan system. The columns display usernames, Display Name, Status, Groups, date of first User access, last User access, User's privileges ( Create Collection or Administrator), and their internal userid.

STIG Manager's Users are automatically created when they have successfully used your Authentication Provider to authenticate and are redirected back to the STIGMan application.

Users can be pre-registered before they have authenticated with your Authentication Provider, but the username must match exactly.

Users can be Unregistered from STIG Manager. If the User has never accessed the system, their User record will be deleted. If the User has accessed the system, the User's Grant and Group assignments will be removed, but their User record will be retained for auditing and attribution purposes. The User will still be able to access the system if granted access by the Authentication Provider.

Application Managers can change a User's Status by selecting the user, and clicking the "Set Unavailable" (or "Set Available") button in the toolbar. 

User Statuses:
  - **Available** - Default Status. Allows an authenticated User access to the system and allows them to be assigned Grants and Group memberships.
  - **Unavailable** - The User will not be able to access the system, and will not appear in User lists for the purposes of assigning Grants or Group membership. 

When an App Manager sets a User's Status to "Unavailable," all the User's existing Grants and Group memberships will be removed. The User's record will remain in the system for auditing and attribution purposes.

By default, the Users page filters on the "Status" column, so that only "Available" Users are displayed. To view all Users, change the Status filter with the Filter button above the grid.


.. thumbnail:: /assets/images/admin-users.png
      :width: 50% 
      :show_caption: True
      :title: Users Administration

.. thumbnail:: /assets/images/new/admin-users.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Users Administration

|

User Properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Select a User to view that User's Grants and other information in the User Properties pane on the right.
The pane lists the User's email address and other Info, and has User Groups, Direct Grants, Effective Grants, and Last Claims tabs. The User Groups tab changes the User's Group membership. The Direct Grants tab lists the Grants that have been specifically applied to the User, and the "Effective Grants" tab includes Collection Grants for Groups the User is a member of. The "Last Claims" tab displays the OIDC access token information received the last time the User accessed the application. 

.. thumbnail:: /assets/images/admin-user-properties.png
      :width: 50% 
      :show_caption: True
      :title: User Properties

.. thumbnail:: /assets/images/new/admin-user-properties.png
      :width: 50% 
      :show_caption: True
      :title: NEW: User Properties

|

User Groups Page
---------------------------------

This page lists the groups created in the STIGMan system. The columns display the Group Name, Description, Creation Date, the number of Users in the group, and the number of Collections the group has access to.

Only Application Managers can create or modify Groups and their User membership. Once a Group is created, it becomes available to all Collection Owners and Managers to be assigned Grants in their Collections. 


.. thumbnail:: /assets/images/admin-user-groups.png
      :width: 50% 
      :show_caption: True
      :title: User Groups Administration

.. thumbnail:: /assets/images/new/admin-user-groups.png
      :width: 50% 
      :show_caption: True
      :title: NEW: User Groups Administration
      

Groups can be created and deleted with the buttons at the top of the page. Select a Group to edit its Name, Description, Users, and Grants in the User Group Properties pane on the right.

Change the Users in the group from the Users tab by selecting Users and clicking the Add and Remove buttons to move them between the "Available Users" and "Group Members" lists. Group membership changes take effect immediately. 


.. thumbnail:: /assets/images/admin-user-groups-popup.png
      :width: 50% 
      :show_caption: True
      :title: User Group Popup Users Tab

.. thumbnail:: /assets/images/new/admin-user-groups-popup.png
      :width: 50% 
      :show_caption: True
      :title: NEW: User Group Popup Users Tab

Assign Collection Grants to the Group by selecting the "Direct Grants" tab. Select one or more Collections and click Add or Remove to move them between the "Available Collections" and "Direct Grants" lists, then choose a Role for each Grant from its dropdown. Grant changes take effect immediately.

.. thumbnail:: /assets/images/admin-user-groups-popup-grants.png
      :width: 50% 
      :show_caption: True
      :title: User Group Popup Grants Tab

.. thumbnail:: /assets/images/new/admin-user-groups-popup-grants.png
      :width: 50% 
      :show_caption: True
      :title: NEW: User Group Popup Grants Tab



STIG Benchmarks Page
-----------------------------------------
This page lists every STIG that has been loaded into STIG Manager and allows App Managers to import new STIGs into STIG Manager.
The grid indicates the Benchmark ID, Title, Status, Latest Revision, Revision Date, Earlier Revisions, number of Rules, and number of Collections using each STIG.

Use the "Import STIG" button to add new STIGs, and the "Remove Revision" menu to delete specific Revisions (or entire STIGs) of the selected Benchmarks. "Open Library" jumps to the selected STIG in the STIG Library. STIGs can be imported individually, or as a .zip library of many STIGs.

.. note::
      By default, if the imported file contains a STIG Revision that already exists in the STIG Manager system, STIG Manager will retain the existing revision. To overwrite existing revisions, select the "Replace existing Revisions" checkbox when importing.


.. thumbnail:: /assets/images/admin-stigs.png
      :width: 50% 
      :show_caption: True
      :title: STIGs Administration

.. thumbnail:: /assets/images/new/admin-stigs.png
      :width: 50% 
      :show_caption: True
      :title: NEW: STIGs Administration


.. note::
   STIG Manager only knows about the STIGs you have imported into the system. This action must be performed by App Managers, often quarterly to keep pace with DISA releases.  Once a new STIG revision is imported, that revision becomes the default STIG that is presented for Review to the User. Reviews for old STIGs still in the system can be viewed by choosing the Revision from the breadcrumb bar of the Asset Review workspace for that STIG.



-------------------------

.. _service-jobs:

Service Jobs Page
------------------------------------

This page allows App Managers to control and view the background Service Jobs that have been created in the STIGMan database. It includes information about the jobs, their schedule, component tasks, status, run history and output.  App Managers can create, modify, schedule, delete, and run jobs from this panel.  Jobs created by `system` cannot be deleted, but they can be disabled and their schedule can be modified.

**It is highly recommended that you enable and schedule these jobs to maintain the health of your STIG Manager database.** These jobs help keep your database lean and performant by cleaning up unreferenced data that can accumulate over time.  They also enable some important features such as Review Aging, which automatically acts on reviews that have not been updated within a configurable time threshold. See suggested setup in the :ref:`enable-service-jobs` section of this guide.


.. thumbnail:: /assets/images/admin-service-jobs.png
      :width: 75% 
      :show_caption: True
      :title: Service Jobs Administration

.. thumbnail:: /assets/images/new/admin-service-jobs.png
      :width: 75% 
      :show_caption: True
      :title: NEW: Service Jobs Administration

The Service Jobs feature provides a framework for managing scheduled background operations in STIG Manager. This feature enables both system-defined and user-defined jobs that can run one or more predefined tasks either on a schedule or immediately on demand.

Service Jobs manage features such as database maintenance and cleanup tasks, as well as the Review Aging task, which automatically acts on reviews that have not been updated within a configurable time threshold. Service Jobs will continue to serve as the foundation for future capabilities, including time-based snapshots and analysis.

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
 - **Update Aged Reviews**: Modifies or deletes reviews that meet conditions defined by the Review Aging rules specified at the Collection level. Disabled by default. See the :ref:`review-aging-rules` section of the User Guide for more information about Review Aging rules and configuration.


.. note::
   Some System Jobs, such as **Update Aged Reviews**, are enabled and scheduled by the App Manager but driven by configuration specified by Collection level rules. When the job runs, it processes each collection that has configured rules; collections without rules are silently skipped. See :ref:`review-aging-rules` in the User Guide for rule configuration details.

.. rubric:: Job Components

Each job consists of the following components:

**Tasks**
   Individual operations that perform specific functions. Tasks are pre-defined by the system and can include database maintenance operations, cleanup procedures, and analytical functions. Multiple tasks can be assigned to a single job, and will be run sequentially.

   The system provides various pre-defined tasks for common maintenance operations. These tasks can be combined into jobs as needed:

   * **WipeDeletedObjects**: Removes soft-deleted records from the database
   * **DeleteUnmappedReviews**: Cleans up reviews that are no longer mapped to current STIG requirements
   * **DeleteUnmappedAssetReviews**: Removes unmapped reviews specific to individual assets
   * **ReviewAging**: Modifies or deletes reviews that meet conditions defined by the Review Aging rules specified at the Collection level
   * **AnalyzeReviewTables**: Runs the ``ANALYZE TABLE`` command on review-related database tables to optimize query performance

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

.. thumbnail:: /assets/images/new/admin-service-job-properties.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Service Job Properties   

.. rubric:: Managing Jobs

**Creating Jobs**
   Use the "Create" button to define new user jobs. Specify the job name, description, select one or more tasks, and optionally configure a schedule.

**Modifying Jobs**
   Existing jobs can be modified using the "Modify" button. User jobs allow full modification of all properties, while system jobs only permit schedule modifications.

**Running Jobs Immediately**
   Any job can be executed immediately using the "Run Now" button, regardless of its scheduled configuration.

**Removing Jobs**
   User jobs can be deleted using the "Remove" button. System jobs cannot be deleted.

.. rubric:: Monitoring Job Execution

The Service Jobs interface provides detailed execution monitoring:

**Recent Runs**
   The Recent Runs grid below the jobs list shows the execution history of the selected job, with run states (running, completed, failed, shutdown), start times, and duration.

**Runtime Output**
   The Runtime Output grid shows the detailed task-level output of the selected run, including timestamps, message types, and execution status, updating in real-time while a job runs.

**Run Management**
   Individual job runs can be deleted from the execution history as needed for maintenance purposes with the Trash button in the Job Run row.

.. note::
   These Service Jobs are not enabled by default. Administrators must enable the Jobs they wish to use. Exercise caution when modifying or running database maintenance jobs, as these operations can affect system data. Always ensure you have appropriate backups before running destructive maintenance operations.



-------------------------

.. _app-info:

Application Info Page
------------------------------------


This page provides App Managers with a report on the current state, performance, and utilization of the STIGMan application.  

The toolbar allows users to load and save report data files, as well as fetch a new report from the API. The "Save for sharing" button will download a .json file of the current report data with the option to replace specific deployment data such as Collection and User names with generated identifiers. 

The report displays the data source, date, and STIG Manager version at the top. Report data is displayed in the following tabs:

  - **Requests**: Information regarding the requests made to each API endpoint, organized by operationId. This data includes the count of requests, max duration, average duration, response length, error counts, and other useful metrics.  Endpoints with ``projection`` parameters will populate the "Projections" panel with a subset of these metrics. This report also indicates users and clients that made the requests, as well as counts of any error code responses.
  - **Collections**: High level metrics about the size and state of all Collections, including "disabled" Collections and Assets, total Reviews, grants, etc. This report offers additional tabs reporting Grants, Labels, STIG Assignments, and Settings by Collection. The "Access Control Lists" panel lists users and applicable access control rules for users with limited access to the Collection, such as those with Restricted-type grants. 
  - **Users**: A report of all users of the system, their privileges, grants, and last active date.  This report also includes panels summarizing overall user counts by privilege, and by last activity date (last 30/90 days).
  - **Groups**: A report of all User Groups in the system, their User count, grants, and creation date. 
  - **MySQL**: Information about the managed data, configuration, and status of the MySQL database. 
  - **NodeJs**: Information about the configuration of the STIGMan application, as well as status of the NodeJs server, including the version, uptime, and memory usage.
  - **JSON Tree** : A tree view of the data that is available in the report. Equivalent to the contents of the .json file that can be downloaded with the "Save to file" button.


.. note::
   Help the STIG Manager team improve the application by sharing this report if you encounter issues or have suggestions for improvement. You can email the report to the team at RMF_Tools@us.navy.mil


.. thumbnail:: /assets/images/admin-app-info.png
      :width: 50% 
      :show_caption: True
      :title: Application Info Report

.. thumbnail:: /assets/images/new/admin-app-info.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Application Info Report


|


-------------------------

.. _log-stream:

Log Stream Page
------------------------------------


This page provides App Managers with real-time streaming of log records from the STIG Manager backend to the web client. This can help troubleshoot issues that would otherwise require direct access to the backend logs. 
Log records are transmitted over a WebSocket connection, which requires a properly configured reverse proxy or firewall to allow WebSocket traffic. In compatible browsers, the stream can be recorded to a file for later analysis. Reverse Proxy configuration guidance can be found in the :ref:`reverse-proxy`.

This feature is experimental, however it is enabled by default. It can be disabled by setting the ``STIGMAN_EXPERIMENTAL_LOGSTREAM`` environment variable to ``false``. 


.. thumbnail:: /assets/images/admin-log-stream.png
      :width: 50% 
      :show_caption: True
      :title: Application Log Stream

.. thumbnail:: /assets/images/new/admin-log-stream.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Application Log Stream


The Log Stream page contains the Log Stream Panel, JSON Tree Panel, and API Transactions Panel.


Log Stream Panel
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The Log Stream panel contains a toolbar with controls to start and stop the log stream, record the stream to a file, and filter log records by level and component.


- Click the "Stream" button to open a WebSocket connection to the backend and begin receiving log records. The log records will appear in the panel in real-time as they are generated by the backend. Click the "down" arrow portion of the Stream button to expand the filter options for this function.

.. thumbnail:: /assets/images/admin-log-stream-filter.png
      :width: 25% 
      :show_caption: True
      :title: Application Log Stream Filter Options

.. thumbnail:: /assets/images/new/admin-log-stream-filter.png
      :width: 25% 
      :show_caption: True
      :title: NEW: Application Log Stream Filter Options



- Click the "Record" button to start recording the log stream to a file, and again to stop the recording. The "Record" function is not available in Firefox.
- The "Preserve Log" checkbox will retain log entries in the panel when the stream is stopped and then started again. 
- The "Wrap" button will toggle line wrapping in the panel. 
- The "Clear" button will clear all log entries from the panel.

JSON Tree Panel
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Clicking a Log entry in the Log Stream Panel or API Transactions Panel will display that log entry in a structured tree format in the JSON Tree panel. Each log record can be expanded to view its individual fields and values. 


API Transactions Panel
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This panel displays a grid-style view of the API transactions visible in the raw Log Stream Panel (``rest`` in the Log Stream filter). 
Selecting an entry in this grid will auto-select the corresponding log entry in the Log Stream Panel, and display it in the JSON Tree Panel.



-------------------------

.. _app-data:

Export/Import Data Page
------------------------------------

This page allows App Managers to stream JSONL records from the STIG Manager backend database to a file, with an option to GZip compress the stream. Choose a Format and click "Download Application Data". The final size of the file is unknown when the operation starts, so no progress indication can be provided. Transfer rates will be higher if the server does not compress the stream, but the final file may be up to 10x larger.

The downloaded file can be imported into the same or a different STIG Manager instance with "Select appdata file..." followed by "Replace Application Data". All existing data will be overwritten. Importing a Gzip compressed file will reduce upload time and memory usage on the API service.

This feature must be enabled for the deployment by setting the ``STIGMAN_EXPERIMENTAL_APPDATA`` environment variable to ``true``. 

.. warning::
   This feature is Experimental and continues to be developed, breaking changes may happen. Use at your own risk and rely on daily database backups to maintain your data.  ALL data in the destination instance will be replaced.

.. thumbnail:: /assets/images/admin-app-data.png
      :width: 50% 
      :show_caption: True
      :title: Application Data Import/Export

.. thumbnail:: /assets/images/new/admin-app-data.png
      :width: 50% 
      :show_caption: True
      :title: NEW: Application Data Import/Export


|

