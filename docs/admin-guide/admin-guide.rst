.. _admin-guide-doc:


STIG Manager Admin Guide 
###############################################

STIG Manager Admin Guide
=========================

Lists functionality available to Administrators in the STIG Manager app.  For information about administering a deployment of STIG Manager, please see :ref:`installation-and-setup-index`.

Navigation Tree
--------------------
Administrators will see the Administration branch in the Navigation tree, as well as the Collections branch available to all users.

.. index::
   single: Administration Branch

.. _Administration Branch:

Administration Branch
============================
The administration branch provides access to the following Administration panels. 

Collections Admin Panel
--------------------------------
This Panel lists every Collection in the STIGMan system, and allows you to create, delete, and alter them with the buttons at the top.
The columns list the Collection Name, Workflow, Description, Owners, total User members, total Assets, total assigned STIGs, and the date of creation.


.. note::
   Be sure to assign a new Collection an Owner, or no one except for Administrators will be able to see it!


.. thumbnail:: /assets/images/admin-collections.png
      :width: 50% 
      :show_caption: True
      :title: Collection Administration


----------------------

User Grants Admin Panel
---------------------------------
This Panel lists every User known to the STIGMan system. The columns display usernames, Display Name, date of first User access, last User access, User's privileges ( Create Collection or Administrator), and their internal userid.

STIG Manager's Users are automatically created when they have successfully used Keycloak to authenticate and are redirected back to the STIGMan application.

Users can be pre-registered before they have authenticated with Keycloak, but the username must match exactly.

Users can be Unregistered from STIG Manager, which will delete STIGMan's information about the User. If the User accesses STIG Manager again, they will appear as a new User, with no STIG Assignments or Collection Grants.

.. thumbnail:: /assets/images/admin-user-grants.png
      :width: 50% 
      :show_caption: True
      :title: User Grants Administration


------------------------------

STIG and SCAP Benchmarks Admin Panel
-----------------------------------------
This panel lists every STIG that has been loaded into STIG Manager and allows Admins to import new STIGs into STIG Manager.
The panel indicates the Benchmark ID, STIG Title, status, Current Revision, Revision Date, number of Rules, and number of potentially automated Rules for each STIG.

Use the button at the top to Add new STIGs. STIGs can be imported individually, or as a .zip library of many STIGs.


.. thumbnail:: /assets/images/admin-stigs.png
      :width: 50% 
      :show_caption: True
      :title: STIGs Administration


.. note::
   STIG Manager only knows about the STIGs you have imported into the system. This action must be performed by Admins, often quarterly to keep pace with DISA releases.  Once a new STIG revision is imported, that revision becomes the default STIG that is presented for Review to the User. Reviews for old STIGs still in the system can be viewed with the Checklist->Revisions menu item in the Asset Review workspace for that STIG.



-------------------------

.. _app-data:

Application Data Panel
------------------------------------
This panel allows Administrators to download a representation of all data STIGMan manages, minus the Review History and STIGs.
This same data can also be imported, but be aware that if data is moved to a different STIGMan instance, the destination instance must have all STIGs that were assigned to any Assets from the originating instance.

.. warning::
   This feature is considered Experimental! Use at your own risk, and rely on daily database backups to maintain your data!

.. thumbnail:: /assets/images/admin-app-data.png
      :width: 50% 
      :show_caption: True
      :title: Application Data Import/Export


|

