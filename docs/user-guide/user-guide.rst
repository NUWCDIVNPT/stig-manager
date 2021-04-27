.. _user-guide-doc:



STIG Manager User Guide 
############################################



.. rubric:: The STIG Manager User Interface

This Document describes every part of the STIG Manager UI available to all STIG Manager Users. This assumes the suggested setup, in which most Users have the Collection Creator privelege.

Please see the :ref:`admin-guide-doc` for Administrative functions.




.. raw:: html

  <video width="480"  controls>
    <source src="../_static/videos/STIG_Manager_Introduction.mp4" type="video/mp4">
  Your browser does not support the video tag.
  </video>



When first logging into STIG Manager, the User is presented with the Navigation tree in the leftmost panel and the Content Panel to the right. When workspaces are selected from the Navigation Tree, the workspace will appear in a tab in the Content Panel to the right. 


.. rubric:: Overall Organization
   :class: rubric3

The STIG Manager UI is composed of two main elements, the Navigation Tree on the left, and the Content Panel to the right. Click the arrow or double-click the node name to expand that branch.  End nodes (those without an arrow) will open a tab in the Content Panel. 


Content Panel
=====================
The Home tab is always available in the Content Panel. 
The Content Panel will be populated with tabs opened by clicking on nodes in the Navigation Tree.

.. note::
   When a Review Workspace tab is opened with a single-click on a Navigation Tree Node, it opens in a Preview tab in the Content Panel. This tab will be replaced by the next tab that is opened. To make this tab permanent, double-click on the tab title at the top of the Content Panel, or edit the workspace's contents. Opening a tab with a double-click on the Navigation Tree node will open the tab in a permanent state. 

.. index::
   single: Home Panel


Home Tab
=======================
The Home tab is always available in the Content Panel. 
This Tab provides links to useful information, such as this Documentation, DISA STIGs, and the RMF Process reference.
The Home Panel also provides information about the STIG Manager Open Source Software Project, and links to the `STIG Manager OSS Project on GitHub <https://github.com/NUWCDIVNPT/stig-manager/>`_ for submitting Issues with the software.

.. thumbnail:: /assets/images/home-tab.png
      :width: 50% 
      :show_caption: True
      :title: Home Tab

====================================

.. index::
   single: Navigation Tree


Navigation Tree
====================
The Navigation Tree (Nav Tree) is in the leftmost panel of the STIG Manager app. The User can navigate all their accessible data via this interface. The Nav Tree presents a list of User's accessible Collections, and Administrative functions for those with Administrator privileges. 

At the top of the Navigation Tree panel is the Users Name and a logout link. Hover over the User to view their Authentication Token information. 

Double-click on nodes (or single-click on the arrows) to expand that node. A single click on leaf nodes (those without arrows) will open the appropriate workspace in the Content Panel to the right.

The components of the Navigation Tree are described below. 

.. thumbnail:: /assets/images/nav-tree.png
      :width: 25% 
      :show_caption: True
      :title: Navigation Tree


----------------------------

.. index::
   single: Collection Node

Collections Node
----------------------
The Collection Node lists all the Collections accessible to the User, as well as the *+Create Collection...* option, for those with that privilege.

+Create Collection...
~~~~~~~~~~~~~~~~~~~~~~~~~
If you have the Collection Creator privilege, this option will appear. Click this item in the Nav Tree to create a new Collection.

.. thumbnail:: /assets/images/create-collection-popup.png
      :width: 50% 
      :show_caption: True
      :title: Create Collection popup


-------------------------

Manage
~~~~~~~~~~~~~~
If you have :term:`Manager or Owner Collection Grants <User>` on a Collection, you will have the option to :ref:`manage <manage-collection-workspace>` that collection. This will allow you to add Assets, STIG Assignments, and Users to the Collection.

See :ref:`manage-collection-workspace` for more info.


STIGs
~~~~~~~
Opening the STIGs Node of the Collection provides a list of every STIG that is assigned to at least one Asset in this Collection that the User has access to. It also provides the *Collection Review* option.

Collection Review
++++++++++++++++++++++
The Collection Review node provides access to the :ref:`Collection Review Workspace`, from which the User can review ALL the assets they have access to for the STIG selected.

See :ref:`Collection Review Workspace` for more info.

STIG-Asset List
+++++++++++++++++++
Clicking on a STIG expands that node into the the STIG-Asset list. This provides a list of all Assets that have been assigned that STIG, and that the User has access to.

Click on an Asset to access the :ref:`Asset Review Workspace` for that STIG-Asset.


Assets
~~~~~~~~~
Opening the Assets Node of the Collection provides a list of every Asset that the User has been granted access to in the Collection.

Asset-STIG List
++++++++++++++++++++++
Clicking on a particular Asset expands a list of every STIG the User has access to that has been assigned to that Asset. 

Click on a STIG to access the :ref:`Asset Review Workspace` for that Asset-STIG.


Reports
~~~~~~~~~
Findings Report
+++++++++++++++++
The Findings Report provides a way to engage with all "Open" findings in a Collection, and generate a precursor POA&M from them.

See :ref:`Findings Report` for more info.


Status Report
++++++++++++++++++
The Status Report provides a way to judge progress and status of all Reviews in a Collection.

See :ref:`Status Report` for more info.

===================================

.. index::
   single: Collection Review

.. _Collection Review Workspace:

Collection Review Workspace
==============================
The Collection Review Workspace allows the user to assess all the Assets they have acess to that have been assigned the selected STIG.

.. thumbnail:: /assets/images/collection-review.png
      :width: 50% 
      :show_caption: True
      :title: Collection Review Workspace


-------------------------------


Checklist with Review Summary Panel
---------------------------------------
This checklist provides a list of Rules for the selected STIG, and a summary of the Evaluations associated with every Asset in the Collection.  Select a Rule in this Panel to see and assess the individual Assets in the Reviews Panel to the right.


Menu Bar functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~
From the Menu, some Options.
By default, the most current STIG is displayed. The User can also select older revisions of the STIG, if they have been imported into the system by an Admin.

Columns
~~~~~~~~~~~~~~
The columns in this panel represent the Rule Severity Category, Rule Id, Rule Title, and aggregated Review Columns for Open (O), Not a Finding (NF), Not Applicable (NA), Not Reviewed (NR), Submitted, Rejected, and Accepted.


Rule Info Panel
-------------------------
This Panel provides the Rule Info for the selected Rule in the panel above. 

Reviews Panel
----------------
This panel provides a list of the Reviews for the selected Rule for every Asset in the Collection.
The Reviews can be Submitted, Accepted, and modified from this panel. 

Menu Bar functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Accept (for Collection Managers or Owners only) and Submit actions are available. These actions will apply to any Assets selected. Multiple assets can be selected with Shift-Click or Ctrl-Click. 


Review Actions
~~~~~~~~~~~~~~~~~~~~~~~
Double-click on any part of the Review Evaluation for an Asset to change them.  Actions and Action Comments can only be changed if the Result is Open.



Resources Panel
-------------------
This Panel provides access to the Feedback, Metadata, and History tabs.

Feedback 
~~~~~~~~~~~~~~~~~
The Feedback function allows Users to see any Feedback submitted about their review, and, if they are a Collection Owner, to reject, with feedback, any review in their Collection.

If Owner
++++++++++++
If the User is an Owner of the Collection, they will also have the option to Accept or Reject reviews.
Reviews can be Accepted with the button at the top of the Reviews Panel, or Rejected with the Feedback function at the bottom of this workspace.

Metadata Tab
~~~~~~~~~~~~~~~~~~~~~
The Metadata panel provides additional information about the selected Asset and Review.

History Tab
~~~~~~~~~~~~~~~~~~~~
The History Panel displays a record of the Review as it has changed over time.

================================

.. index::
   single: Asset Review

.. _Asset Review Workspace:

Asset Review Workspace
====================================
The Asset Review Workspace allows you to view and modify all the Reviews for a specific STIG on the selected Asset. It also presents useful information such as the Reviews for the same Rule on other Assets, the Review's History, and Feedback.
Users can also import results from .ckl or XCCDF formats, and export their results as .ckl checklists.

.. thumbnail:: /assets/images/asset-review.png
      :width: 50% 
      :show_caption: True
      :title: Asset Review Workspace


-------------------------------

Checklist Panel
-------------------
The Checklist Panel presents a list of the Rules associated with the selected STIG. By default, the latest version of the STIG is displayed, along with the Severity Category, Rule ID, Rule Title, Evaluation Result, and :term:`Workflow Status <Workflow>`.  STIGs Rules that are known to STIG Manager to have an automated assessment option are highlighted.

From the Checklist menu in the Menu Bar, the User can:
   * Toggle between Rule and Group displays of the Checklist Panel.
   * Export a .ckl representation of this Assets STIG results.
   * Import STIG results for this Asset in .ckl or XCCDF form.
   * :term:`Submit <Workflow>` all the displayed checks that meet this Collections Workflow requirements.
   * Switch between Revisions of the STIG being displayed.

When a .ckl or XCCDF file is imported, any Reviews that meet the :term:`Workflow` criteria will be set to a Submitted state.

The menu bar also supports a variety of status and Title filters.

.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the Reviews stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

.. note::
   STIG Manager will import and export .ckl files differently depending on the values of certain .ckl elements and Asset metadata. See :ref:`ckl-processing` for more information.    

Rule Info Panel
-------------------
The Rule Info Panel provides the text of the Rule. 
It also provides information about the Controls associated with this Rule, including CCI, AP Acronym, and RMF Control.


Review Resources Panel
------------------------
This Panel provides resources that may be useful in performing the Rule's Evaluation.


Other Assets tab
~~~~~~~~~~~~~~~~~
The Other Assets tab shows Evaluations that have been performed against other Assets in the same Collection that the User has access to.  The Reviews from this list of assets can be dragged and dropped onto the selected Asset's Review Panel below.


Feedback tab
~~~~~~~~~~~~~~~~~~
If this Review has been Rejected, Feedback provided by the Collection Owner is displayed here.

History tab
~~~~~~~~~~~~~~~~~
This History tab displays how this Review has changed over time.


Review Panel
----------------------------
The Review panel contains the Evaluation and any required Recommendation info for this Review.

Evaluation
~~~~~~~~~~~~~~~~~~
The Evaluation holds the actual Result of a compliance decision about this Rule on the selected Asset, and the required Commentary. The Results supported are: Open (O), Not a Finding (NF), Not Applicable (NA) and Not Reviewed (NR).

When an XCCDF file is imported, the Evaluation Comment will be constructed out of available metadata in the XCCDF file.

In a .ckl import or export, the equivalent fields are Finding and Finding Details.


Recommendation
~~~~~~~~~~~~~~~~~~~~~
Setting an Evaluation Result to "Open" enables the Recommendation section.
The Recommendation holds the Action and Action Comment describing the steps the Reviewer expects must be taken to address the Open finding.  The Actions supported are: Remediate, Mitigate, and Exception.
In a .ckl import, the Action Comment is equivalent to the Comment field.
In a .ckl export, the Action is prepended(in all caps, with a colon ie. REMEDIATE:) to the Action comment, as the Action field is not present in most versions of .ckls.  STIG Manager understands this convention, and will appropriately set the Recommendation Action if it sees one of those terms prepended to the Action Comment.  .ckls produced by the commonly used tool STIG-Viewer will not set this Action unless the Reviewer adds the appropriate keyword to the beginning of their Action Comment themselves.

Modified
~~~~~~~~~~~~~
The User and Timestamp associated with the last change to this Review.

Save and Save/Submit Buttons
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The buttons on the bottom of the Review Panel allow the User to simply Save the review for later, or to Submit the Review, which will start its engagement with the :term:`RMF Workflow <Workflow>`.  In most use cases, the goal for Evaluators will be to get every Review into a "Submitted" state.  Once Submitted, the Collection Owner can set the Review to "Accepted" to lock it. The Collection Owner can also Reject the Review with Feedback, which will be marked so that the 


==============================

.. index::
   single: Findings Report

.. _Findings Report:

Findings Report Workspace
=====================================
The Findings Report provides a view of all Open Reviews in the Collection that the User has access to.

.. thumbnail:: /assets/images/findings-report.png
      :width: 50% 
      :show_caption: True
      :title: Findings Report


-------------------------------

Aggregated Findings
--------------------------
The Aggregated Findings Panel provides a view of all Rule Ids that have at least one "Open" Evaluation in a Collection. By default this view is aggregated by Group ID, and includes the columns: Severity Category, Group ID, Group Title, Number of Assets, and relevant STIG.

Menu Bar
~~~~~~~~~~~~
The Menu Bar allows the User to aggregate this view by Group ID, Rule ID, or CCI.  It also allows the User to filter the list by STIG. 

Export a .csv or POA&M 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
At the bottom of this panel are Export and Generate POA&M... buttons.  The Export button exports a .csv file, and the POA&M button will ask the User to set a few options and will then produce a pre-populated POA&M file.



Individual Findings
-----------------------
Select an aggregated finding in the left panel, to bring up information about the specific assets with that finding in the Individual Findings Panel.
Information about the Asset, Rule, Action, Last Modified Date, and applicable STIG or STIGs can be found in the default columns, with addional Review info in the expanding Rows.

This section of the Report can be exported on its own.


===========================================

.. index::
   single: Status Report

.. _Status Report:

Status Report
===================
Provides a view of the overall Status and Evaluation progress of the entire Collection.

This report can be grouped by Asset or by STIG using the Grouping options at the top of the panel.

This report consists of the total number of Checks associated with each Asset or STIG accross the Collection, depending on how it is grouped.  The report also lists the number of Checks with no Evaluation at all, Checks that have been Saved, Submitted, Returned, and Accepted as a way to guage overall Evaluation progress of the Collection.  The total number of "Open" Severity Category 1, 2, and 3 Rules is also displayed to give an indication of the vulnerability status of the Collection.

This report can be exported as a .csv using the Down-Arrow button at the botom of the panel.


.. thumbnail:: /assets/images/status-report.png
      :width: 50% 
      :show_caption: True
      :title: Status Report


================================

.. index::
   single: Manage Collection

.. _manage-collection-workspace:

Collection Management Workspace
===================================
Allows a Collection Manager or Owner to Manage their Collection.
From this Workspace, the User can:

   * Alter the Name, Workflow, and Metadata associated with the Collection
   * Batch import CKL or XCCDF files to automatically scaffold or add to their Collection
   * Batch export CKL files for external tools such as eMASS
   * Add/Modify/Remove Assets in the Collection 
   * Add or remove STIGs from the Collection (STIGs must be assigned to at least 1 Asset to be associated with a Collection)
   * Add/Modify/Remove User Grants in the Collection
   * Delete the Collection (if Collection Owner)

.. thumbnail:: /assets/images/manage-collection-workspace.png
      :width: 50% 
      :show_caption: True
      :title: The Manage Collections Workspace


-------------------------------


Collection Properties Panel
--------------------------------
This Panel allows Collection Managers and Owners to change the name of the Asset, its workflow, and any associated Metadata.  Collection Owners can also delete this Collection. 

.. thumbnail:: /assets/images/collection-properties.png
      :width: 50% 
      :show_caption: True
      :title: Collection Properties


-------------------------------

.. _grants-panel:


Grants Panel
-------------------
This Panel displays all the Users who have access to some portion of this Collection.

User Grants can be added or removed using toolbar buttons at the top of this Panel. Double-clicking a Grant will allow you to modify the Grant. When creating or modifying a Grant, typing into the Username field will display a filtered droplist of the available users. 

See :term:`User` for more info about these Access Levels.

.. thumbnail:: /assets/images/user-grants.png
      :width: 50% 
      :show_caption: True
      :title: The User Grants Panel


-------------------------------

When a User with a Restricted Grant is selected, the "User access..." button is enabled. Restricted Users must be given access to specific Asset-STIG pairs. 

.. thumbnail:: /assets/images/restricted-access-list.png
      :width: 50% 
      :show_caption: True
      :title: The Restricted User Access List


-------------------------------

       
Assets Panel
------------------
This panel lists the Assets that are a part of this Collection. An Asset's properties can be modified by double-clicking on the Asset row or by choosing "Change Asset Properties..." from the toolbar.

The menu bar provides several functions, allowing the User to Create, Delete, and Change Assets in the Collection.
The :ref:`Collection Builder` option allows the User to create many Assets and their STIG Assignments at once. 

.. thumbnail:: /assets/images/assets-panel-toolbar.png
      :width: 50% 
      :show_caption: True
      :title: Collection -> Manage -> Assets toolbar


-------------------------------


Create Asset
~~~~~~~~~~~~~~~
Click the Create Asset button to create an Asset manually. Enter relevant Asset info in the popup window that appears. STIGs can also be assigned to the new Asset from this interface.

.. thumbnail:: /assets/images/create-asset.png
      :width: 50% 
      :show_caption: True
      :title: Create an Asset


-------------------------------

.. index::
   single: Collection Builder

.. _Collection Builder:

Import CKL or SCAP to Build or Update Your Collection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

STIG Manager lets you populate your entire Collection from scratch or add to an existing Collection with a bulk import of .ckl and XCCDF files. This feature will create any new Assets you submit files for, and assign them the STIGs specified in the imported files.  If the Asset already exists, the newly imported STIGs will be assigned to them. The User can also choose whether or not to import the Reviews in the imported files, or just create the Assets and STIG Assignments.

The Asset Name must match exactly. Check the :term:`ckl` and :term:`XCCDF` glossary entries for how their individual fields map to STIG Manager fields. 

.. note::
   When STIG Manager creates an Asset from an imported file, it will populate the Name, FQDN, IP, and MAC fields if they are present in the file. If the asset is already created, those fields are NOT updated when a file is imported. 


.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the Reviews stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

Collection Builder Process
++++++++++++++++++++++++++++++++++++


From the Collection Management workspace, click the "Import CKL or SCAP..." button at the top of the Assets panel .

.. thumbnail:: /assets/images/collection-builder-files.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder File Select



|

Drag and drop or Select one or more .ckl or XCCDF files.

-------------------------------


.. thumbnail:: /assets/images/collection-builder-errors-and-warnings.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Errors and Warnings


|

If there is an issue with the files you selected, they will appear here. One error you may encounter is that the STIG in the selected file is not installed in STIG Manager. If this is the case, contact a STIG Manager Administrator to have them install it.

This screen will be skipped if there are no issues with the files you have selected.

-------------------------------

.. thumbnail:: /assets/images/collection-builder-options.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Options and Summary


|

You will be presented with a summary view of the files you have submitted.
This view shows the Assets, STIGs, Review totals, filenames and date of the data contained in the submitted files. 

New Assets and new STIG assignments that will result from this import are indicated with a (+) after the Asset or STIG name.

The User can configure the import with two options. By default, both are selected:
   * Create or update Assets and STIG associations: This option will create the indicated Asset and STIG Assignments.
   * Import Reviews: This option will bring in the Review content of the submitted files. These Reviews will overwrite the equivalent Reviews already in the system.

If the summary and options and options are appropriate, click the "Add to Collection..." button.

-------------------------------


.. thumbnail:: /assets/images/collection-builder-import.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Import Log

|

The user is presented with the log of the import. 

.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the Reviews stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

.. note::
   STIG Manager will import and export .ckl files differently depending on the values of certain .ckl elements and Asset metadata. See :ref:`ckl-processing` for more information.    

-------------------------------


.. _export-by-asset:

Export CKLs by Asset
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export CKLs..." button in the Assets Panel Toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level, whole Asset level, or every Asset in the Collection. 

One multi-STIG .ckl file will be generated for every unique Asset selected. The package of .ckl files will be presented as a .zip file.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.


.. thumbnail:: /assets/images/checklist-archive-export-asset.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export by Asset


.. thumbnail:: /assets/images/checklist-archive-export-log.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export log


--------------------------

Delete Asset
~~~~~~~~~~~~~~~~~~~~
To Delete an Asset, select an Asset and click the Delete Asset button. A popup will ask you to confirm the action. 

Change Asset Properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
To alter an Asset's properties, select an Asset and click this button, or double-click the Asset row.

STIGs Panel
-------------------
This panel lists all the STIGs that have been assigned to at least one Asset in the Collection.
STIG Assignments can also be added or removed from Assets with the buttons at the top of this panel.

.. thumbnail:: /assets/images/stigs-panel.png
      :width: 50% 
      :show_caption: True
      :title: STIGs Panel


-------------------------------


Assign STIG
~~~~~~~~~~~~~~~~~~~~~~
Select Assign STIG to add a new STIG to the Collection. A popup will allow you to select a STIG that is not yet assigned to an Asset. Click the Assign STIG button on this popup to select Assets that should have this STIG assigned to them. 

.. thumbnail:: /assets/images/stig-assignments.png
      :width: 50% 
      :show_caption: True
      :title: STIG Assignments


-------------------------------

Remove STIG
~~~~~~~~~~~~~~~~~~~~~
The Remove STIG button will remove the selected STIG from all Assets that are assigned it in this Collection.

.. note::
   Reviews for Rules in the deleted STIG will also be deleted!


Change Assigned Assets
~~~~~~~~~~~~~~~~~~~~~~~~
Select "Change assigned Assets..." or double-click a STIG to change what Assets are assigned this STIG in this Collection.


.. _export-by-stig:


Export CKLs by STIG
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export CKLs..." button in the STIGs Panel Toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level, whole STIG level, or every STIG in the Collection. 

One multi-STIG .ckl file will be generated for every unique Asset selected. The package of :term:`ckl` files will be presented as a .zip file.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.


.. thumbnail:: /assets/images/checklist-archive-export-stig.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export by STIG



.. thumbnail:: /assets/images/checklist-archive-export-log.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export log


|


.. _ckl-processing:

A Note on .CKL Processing
=================================

When the STIG Manager Client imports data from :term:`.ckl files <ckl>`, in the simplest case it will attempt to match (and, in some instances, create) the Asset specified in the .ckl's ``<HOST_NAME>`` element.  However, if the ``<ASSET><WEB_OR_DATABASE>`` element in the .ckl has a value of ``true``, special processing is invoked. This processing will attempt to match the ``<HOST_NAME>``, ``<WEB_DB_SITE>`` and ``<WEB_DB_INSTANCE>`` values in the .ckl with Asset metadata when identifying the Asset.  When the STIG Manager Client creates Assets from .ckls with these elements populated, it will populate the same Asset metadata according to the table below. 

Conversely, when STIG Manager produces a .ckl file from an Asset that has the below metadata values set, it will populate the appropriate .ckl elements. 

The following metadata properties are used when the value of ``<ASSET><WEB_OR_DATABASE>``  is ``true``:

.. list-table:: **CKL elements map to STIG Manager Asset metadata**
   :widths: 20 20 60
   :header-rows: 1
   :class: tight-table

   * - ``<ASSET>`` Child Element
     - Asset metadata
     - Note
   * - ``<WEB_OR_DATABASE>``
     - ``cklWebOrDatabase``    
     - When set to true, invokes additional processing using the below elements and metadata     
   * - ``<HOST_NAME>``
     - ``cklHostName``    
     - This value will populate the ``<HOST_NAME>`` element of a ckl, as opposed to the Asset name in other cases.
   * - ``<WEB_DB_SITE>``
     - ``cklWebDbSite``
     - No specific purpose for STIG Manager, other than contributing to Asset identification 
   * - ``<WEB_DB_INSTANCE>``
     - ``cklWebDbInstance``          
     - No specific purpose for STIG Manager, other than contributing to Asset identification 

   
If the importer needs to create an Asset, it will set this metadata and set the initial Asset name to ``<HOST_NAME>-[<WEB_DB_SITE> | "NA"]-[<WEB_DB_INSTANCE> | "NA"]``. The Asset name is not meaningful (to STIG Manager) and it can be changed by the user later, if required.


.. thumbnail:: /assets/images/asset-metadata-and-ckl-elements.png
      :width: 75% 
      :show_caption: True
      :title: Corresponding Asset Metadata and .ckl elements




|


