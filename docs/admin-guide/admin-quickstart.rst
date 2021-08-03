.. _admin-quickstart:


STIG Manager Administrator Walkthrough
########################################


This Admin Walkthrough will walk you through typical responsibilities for a STIG Manager User with the Administrator role. This Walkthrough assumes you are familiar with the terms and features specified in the :ref:`user-guide-doc`.
Beyond the permissions granted to normal Users, Administrators have the ability to:

   * Update STIGs and SCAP Benchmarks in STIG Manager
   * Administer Collections to which they have not been specifically granted access
   * Administer User Grants
   * Export and Import Application Data (Experimental feature for now.)


.. ATTENTION::
   Being an Administrator in STIG Manager does not give you the ability to *create* new users or assign them new Roles (Admin, or Collection Creator). Creating users and assigning Roles can only be done from the Keycloak Management Console, and you must have the proper permissions in Keycloak to do this.


Administrator Menu
=======================

Administrators in STIG Manager have access to 4 additional Administration tabs that other users do not, accessible from the Navigation Tree.

Collections Tab
---------------------------
This tab presents a list of all Collections in STIG Manager, as well as some statistics about the Collection.  It also includes buttons to create, delete, and alter Collection properties and grants. 

In most cases, Collection Owners should be administering their own Collections. However, in cases where the Owner is unavailable, or has accidentally removed all owners from a Collection, this interface allows an Admin to assign new Owner Grants to Collections by double-clicking the Collection or using the "Collection Properties" button. The Admin can also delete Collections if required.

.. thumbnail:: /assets/images/CollectionAdmin.png
   :width: 50% 
   :show_caption: True
   :alt: Collection Admin
   :title: Collection Admin


----------------------------------

User Grants
-------------------
This tab presents a lit of all users known to STIG Manager, as well as some statistics about them. 
It also includes buttons to pre-register User, unregister User, and modify User Grants. 

Pre-registering Users
************************
The pre-register function does not grant access to STIG Manager. User *access* is solely managed via Keycloak. The pre-register function allows an Admin to assign Grants to a user that has not yet accessed the system, presuming that that the user will be authenticated via Keycloak at some later date. In that case, the Username entered when preregistering must match the username received from Keycloak when they finally log in.  A pre-registered user will have *No value* in the Last Access column of this screen until they actually access STIG Manager. 

Unregistering Users
************************
Unregistering Users will remove all their Collection Grants, but will not prevent access to STIG Manager unless the user is also disabled/deleted/altered in Keycloak.  However, once un-registered they will not see any Collections when they access STIG Manager. Depending on their Role in Keycloak, they may still be able to create a collection or even Administer STIG Manager. 

Modifying Users
************************

The only changes that can be made to Users in the STIG Manager interface is their Collection Grants. All other data in the User pop-up is derived from information in the access token, which is managed in Keycloak.

.. thumbnail:: /assets/images/userAdmin.png
   :width: 50% 
   :show_caption: True
   :alt: User Admin
   :title: User Admin


-------------------------------


.. _stig-import:


STIG and SCAP Benchmarks
---------------------------------

This tab shows you a list of STIGs known to this instance of STIG Manager along with some basic statistics about them, such as their rule count and revision date. This interface also allows you to import new STIGs. This can be done individually, or as a .zip file of multiple STIGs (such as the `quarterly STIG Library Compilations from DISA <cyber.mil/stigs/compilations/>`_).

.. thumbnail:: /assets/images/StigAdmin.png
   :width: 50% 
   :show_caption: True
   :alt: STIG Admin
   :title: STIG Admin


|

Click the "Import STIGs" button to be prompted to select a file for import. 



--------------------------------------------------
   
STIG Manager uses one set of STIG and SCAP benchmarks. When a new STIG is imported from this interface, ALL assets in the system will reflect new version of the imported STIG as the default. However, when viewing an individual Asset older revisions of STIGs, if present, can be selected.


Application Data
-----------------------

This Tab has buttons that allow you to Import and Export all User and Collection data from STIG Manager. These options are considered experimental and should not be relied upon to move or preserve Production data or other data you cannot afford to lose. On import, the imported data completely replaces all STIG Manager data currently on the system. Compatibility with future versions of STIG Manager is not guaranteed. They are currently used only for Development purposes. All that said, we are considering developing a method for handling the importation of STIG Manager Collection objects and their associated Assets, STIGs, Reviews, History, and Users.







