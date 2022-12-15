.. _user-guide-doc:



STIG Manager User Guide 
############################################



.. rubric:: The STIG Manager User Interface

This Document describes every part of the STIG Manager UI available to all STIG Manager Users. This assumes the suggested setup, in which most Users have the Collection Creator privilege.

Please see the :ref:`admin-guide-doc` for Administrative functions.




.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/wv_Gdbl_LrU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

-------------------------

.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/ZwVJ0eO2d_I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

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

|

The Assets and STIGS you see in the NavTree can be filtered by clicking on the Label icon next to every Collection:

.. thumbnail:: /assets/images/navtree-label-filter-button.png
      :width: 25% 
      :show_caption: True
      :title: Navigation Tree Label Button

|

Click the button, select one or more Labels and then click off the menu, or hit "Apply":

.. thumbnail:: /assets/images/navtree-label-filter.png
      :width: 25% 
      :show_caption: True
      :title: Navigation Tree Label Filter

Only Assets with your selected Labels will be displayed. 


----------------------------

.. index::
   single: Collection Node

Collections Node
----------------------
The Collection Node lists all the Collections accessible to the User, as well as the *+Create Collection...* option, for those with that privilege.

+Create Collection...
~~~~~~~~~~~~~~~~~~~~~~~~~
If you have the Collection Creator privilege, this option will appear. Click this item in the Nav Tree to create a new Collection. See the  :ref:`Manage Collection <manage-collection-workspace>` section of this document for more information about the settings available here. 

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


Metrics Report
++++++++++++++++++
The Metrics Report provides a way to judge progress and status of all Reviews in a Collection.

See :ref:`Metrics Report` for more info.

===================================

.. index::
   single: Collection Review

.. _Collection Review Workspace:

Collection Review Workspace
==============================
The Collection Review Workspace allows the user to assess all the Assets they have access to that have been assigned the selected STIG.

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

.. thumbnail:: /assets/images/asset-review-stig-revisions.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection


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
Double-click on any part of the Review Evaluation for an Asset to change them.  


Resources Panel
-------------------
This Panel provides access to the Feedback, Attachments, and Log tabs.

Feedback 
~~~~~~~~~~~~~~~~~
The Feedback function allows Users to see any Feedback submitted about their review, and, if they are a Collection Owner, to reject, with feedback, any review in their Collection.

Collection Owner Abilities
++++++++++++++++++++++++++++++
If the User is an Owner of the Collection, they will also have the option to Accept or Reject reviews.
Reviews can be Accepted with the button at the top of the Reviews Panel, or Rejected with the Feedback function at the bottom of this workspace.


Attachments tab
~~~~~~~~~~~~~~~~~
The Attachments tab allows Reviewers to attach images that support their assessment to their Review. Hover over a specific attachment to see buttons for viewing or deleting that attachment. The "Attach Image..." button becomes available once there is an Evaluation Result for the Review. Support for additional file formats may be added if `Feature Requests <https://github.com/NUWCDIVNPT/stig-manager/issues/new/choose>`_ are submitted. 


Log Tab
~~~~~~~~~~~~~~~~~~~~
The Log Panel displays a record of the Review as it has changed over time.

================================

.. index::
   single: Asset Review

.. _Asset Review Workspace:

Asset Review Workspace
====================================
The Asset Review Workspace allows you to view and modify all the Reviews for a specific STIG on the selected Asset. It also presents useful information such as the Reviews for the same Rule on other Assets, the Review's Log, and Feedback.
Users can also import and export results in .ckl or XCCDF checklist formats.

.. thumbnail:: /assets/images/asset-review.png
      :width: 50% 
      :show_caption: True
      :title: Asset Review Workspace


-------------------------------

Checklist Panel
-------------------
The Checklist Panel presents a list of the Rules associated with the selected STIG. By default, the latest version of the STIG is displayed, along with the Severity Category, Rule ID, Rule Title, Evaluation Result, Result origin, and :term:`Review Status <Review>`.  The "gear" column in the checklist panel provides information about the Result stored in STIG Manager. The "user" icon indicates the Review was performed manually. The "gear" icon indicates an automated tool evaluated the Review. The arrow icon indicates an automated tool produced the result with the help of User input, such as an XCCDF Override or an Evaluate STIG Answer File. 

From the Checklist menu in the Menu Bar, the User can:
   * Toggle between Rule and Group displays of the Checklist Panel.
   * Export a .ckl or XCCDF representation of this Assets STIG results.
   * Import STIG results for this Asset in .ckl or XCCDF form.
   * Switch between Revisions of the STIG being displayed.


The menu bar also supports a variety of status and Title filters.

.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the individual Reviews are stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

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

Attachments tab
~~~~~~~~~~~~~~~~~
The Attachments tab allows Reviewers to attach images that support their assessment to their Review. Hover over a specific attachment to see buttons for viewing or deleting that attachment. The "Attach Image..." button becomes available once there is an Evaluation Result for the Review. Support for additional file formats may be added if `Feature Requests <https://github.com/NUWCDIVNPT/stig-manager/issues/new/choose>`_ are submitted. 

.. thumbnail:: /assets/images/attachments-hover-crop.png
      :width: 25% 
      :show_caption: True
      :title: Attachments Tab

.. thumbnail:: /assets/images/attachments-preview-crop.png
      :width: 25% 
      :show_caption: True
      :title: Attachment Preview

|

Feedback tab
~~~~~~~~~~~~~~~~~~
If this Review has been Rejected, Feedback provided by the Collection Owner is displayed here.

Log tab
~~~~~~~~~~~~~~~~~
This Log tab displays how this Review has changed over time.


Review Panel
----------------------------
The Review panel contains the Evaluation and any required details or commentary for this Review.

Evaluation
~~~~~~~~~~~~~~~~~~
The Evaluation holds the actual Result of a compliance decision about this Rule on the selected Asset, and the required Details and/or Comment. The Results supported are: Open (O), Not a Finding (NF), Not Applicable (NA), Informational (I), and Not Reviewed (NR).  The colored sprites next to the Result provide additional information about the source of the Result. 


Reviews can be set to Saved or Submitted statuses from this interface. "Saved" simply indicates that the review has been logged to the system. The "Submitted" status indicates that the Evaluator considers the review to be "complete"  and may be optionally be "Accepted" or "Rejected" by a User with proper grants in the Collection.

The requirements for a Review to be set to "Submitted" status can be configured in the Collection Management Workspace by Collection Owners and Managers. These requirements will be displayed in this interface if you hover over the ``(?)`` icon next to each field label. 

The default Settings for Reviews in Collections are:
      - Always display the Detail field.
      - Require text in the Detail field in order to Submit. 
      - Display the Comment field for "Findings only".
      - Require text in the Comment field for "Findings only" in order to Submit.
      - Review must have an Evaluation Result of "Not A Finding," "Not Applicable," or "Open. (Not Configurable)


.. thumbnail:: /assets/images/review-requirements-popup.png
      :width: 50% 
      :show_caption: True
      :title: Review Requirements


|


Attributions
~~~~~~~~~~~~~~~
- Reviewed: The User and Timestamp associated with the last change to this Reviews content.
- Last Status Change: Changes to the status of a Review (Saved, Submitted, Accepted, or Rejected) are tracked separately and displayed here.

.. thumbnail:: /assets/images/review-eval-panel.png
      :width: 50% 
      :show_caption: True
      :title: Review Evaluation Panel with Attributions

|

Save, Save/Submit, and Accept Buttons
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The buttons on the bottom of the Review Panel allow the User to simply Save the review for later, to Submit the Review, or to Accept the Review (if they have the proper Collection Grant).  In most use cases, the goal for Evaluators will be to get every Review into a "Submitted" state.  Once Submitted, the Collection Owner can set the Review to "Accepted" to indicate they have ok'd it. The Collection Owner can also Reject the Review with Feedback, which will be marked so that the Reviewer can fix any issue with the commentary, or attempt to Close an Open Finding.

Automated ResultEngine Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If a Review was imported from a source of automated assessments, such as Evaluate STIG or SCC, they may be marked as such in the UI.  The origin of Reviews (Automated, Manual, Override/Answer File) is indicated in the "gear" checklist column, and with colored informational sprites next to the Result in the Review Evaluation Panel. Hover over the sprites for more info. 


.. thumbnail:: /assets/images/asset-review-autoresult.png
      :width: 50% 
      :show_caption: True
      :title: Asset Review Workspace with Automated Results indicated.


.. thumbnail:: /assets/images/asset-review-autoresult-with-override.png
      :width: 50% 
      :show_caption: True
      :title: Review Panel with Overidden Automated Result.      

|

.. ATTENTION:: 
      If a user modifies the Result of an "Automated" Review, it will lose its Automated status. This is indicated with the replacement of the "Automated" badge with a "Manual" one next to the Result, and the absence of the gear symbol for that rule in the Checklist panel. 


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
Information about the Asset, Rule, Last Changed Date, and applicable STIG or STIGs can be found in the default columns, with additional Review info in the expanding Rows.

This section of the Report can be exported on its own.


===========================================

.. index::
   single: Metrics Report

.. _Metrics Report:

Metrics Report Workspace
==============================
The Metrics Report provides a view of the overall Status and Evaluation progress of an entire Collection, as well as metrics export options and various pivoted presentations of a Collection's assessment statistics.


.. note::
      **For the purposes of this report, only Reviews with Not a Finding, Not Applicable, or Open Results are considered "Assessed." Those Reviews that are "Saved" with a Result other than those three do not contribute to the tallies presented here.**


.. thumbnail:: /assets/images/metrics-report-collection-with-nav.png
      :width: 50% 
      :show_caption: True
      :title: Metrics Report

|

Overview Panel
-----------------

On the left, the "Overview" panel provides top-level summary information about your Collection:

      - **Progress Chart** - Presents the proportion of Reviews that have been Assessed out of the total number of Assessments required in a Collection (ie. The total number of Rules contained in all STIGs that have been assigned to all Assets). The number of Assessed Reviews is further broken down by the Status of each of those Reviews. Depending on your process, you may want all your Reviews to wind up in a "Assessed," "Submitted," or "Accepted" status. Percentages for each status are also presented. 
      - **Inventory** - Total number of Assets, unique STIGs, and checklists (STIGs assigned to Assets) in this Collection. 
      - **Findings** - Total number of "Open" Findings in a Collection, broken down by Severity Category.
      - **Review Ages** - The age of the oldest Review in a Collection and the newest Review in a Collection. Whenever Review *content* (Result or commentary) is modified, its timestamp is updated, and this is used to calculate the ages presented here as "oldest" and "newest." The "Updated" block represents the last time the *Status* of a Review changed (ie. when a Saved, Submitted, Accepted, or Rejected status was applied).
      - **Export Metrics** - Various ways to export the data presented in this report. See below for more details. 

.. note::
      The Metrics Report inherits any Label filtering you have applied at the Navtree level, and presents the filtered metrics accordingly.     
      
      .. thumbnail:: /assets/images/metrics-report-collection-with-nav-filters.png
            :width: 50% 
            :show_caption: True
            :title: Metrics Report Filtering


Metrics Export Options
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This panel provides various ways to export the metrics that STIG Manager maintains about your Collection:

      - Grouped By: - The data presented in this report can be exported using several different grouping options:
            - **Collection** - Will produce an entry with one line, aggregating all metrics data for every Asset/STIG in a Collection together.
            - **Asset** - Will produce one entry per Asset in a Collection, tallying all the metrics data for all STIGs assigned to that Asset.
            - **STIG** - Will produce one entry per unique STIG in a Collection, tallying metrics data for all Assets that are assigned that STIG.
            - **Label** - Will produce one entry per Label in a Collection, tallying the metrics data for each Asset that has been assigned that Label, and all of those Asset's assigned STIGs. *Note:* Because Assets can be assigned more than one Label, individual Assets can contribute to more than one Label entry, and the total Asset count may total more than the number of Assets in a Collection. 
            - **Ungrouped** - Will produce an entry for each STIG assigned to each Asset in the Collection. 
      - Style: - The granularity of the metrics data exported:
            - **Summary** - Presents data fields found to be relevant for the most common use cases.  See the table below for field descriptions. 
            - **Detail** - Very granular data, providing counts for all supported Result values, and subtotals for Reviews that were performed by an automated tool. See the table below for field descriptions. 
      - Format: - Data format of the download: 
            - **CSV** - Comma-Separated Values, suitable for manipulation in a spreadsheet editor.
            - **JSON** - JavaScript Object Notation - Useful for most other, non-spreadsheet, applications. 


Available Metrics Data Fields
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The table below describes the fields that are included in the exports available from the Metrics Report interface.  


  .. list-table:: STIG Manager Metrics Data Fields, and the Report Styles that Include Them.
   :widths: 20 70 10 10
   :header-rows: 1
   :class: tight-table

   * - Data Field
     - Description
     - Summary
     - Detail
   * - assessments
     - Total number of required Evaluations assigned to this item (ie. total number of Rules in all assigned STIGs). 
     - **X**
     - **X**
   * - assessed
     - Total number of Reviews that have been marked "pass," "fail," or "notapplicable."
     - **X**
     - **X**
   * - minTs
     - Date of the Evaluation of the oldest Review in the Collection. 
     - **X**
     - **X**
   * - maxTs
     - Date of the Evaluation of the newest Review in the Collection. 
     - **X**
     - **X**
   * - maxTouch
     - Date of the last time the *Status* of a Review in a Collection was changed (ie. when a review was last saved, submitted, accepted, or rejected). 
     - **X**
     - **X**
   * - low
     - Number of failed Reviews for rules with a Severity 3 category. 
     - **X**
     - **X**
   * - medium
     - Number of failed Reviews for rules with a Severity 2 category. 
     - **X**
     - **X**
   * - high
     - Number of failed Reviews for rules with a Severity 1 category. 
     - **X**
     - **X**
   * - saved
     - Total number of Reviews with a "saved" status. 
     - **X**
     - **X**
   * - savedResultEngine
     - Number of Reviews with a "saved" status that were evaluated by an automated tool. 
     - 
     - **X**
   * - submitted
     - Total number of Reviews with a "submitted" status. 
     - **X**
     - **X**
   * - submittedResultEngine
     - Number of Reviews with a "submitted" status that were evaluated by an automated tool. 
     - 
     - **X**
   * - accepted
     - Total number of Reviews with a "accepted" status. 
     - **X**
     - **X**
   * - acceptedResultEngine
     - Number of Reviews with a "accepted" status that were evaluated by an automated tool. 
     - 
     - **X**
   * - rejected
     - Total number of Reviews with a "rejected" status. 
     - **X**
     - **X**
   * - rejectedResultEngine
     - Number of Reviews with a "rejected" status that were evaluated by an automated tool. 
     - 
     - **X**
   * - pass
     - Total number of Reviews with a "pass" result. 
     - **X**
     - **X**
   * - passResultEngine
     - Number of Reviews with a "pass" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - fail
     - Total number of Reviews with a "fail" result. 
     - **X**
     - **X**
   * - failResultEngine
     - Number of Reviews with a "fail" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - notapplicable
     - Total number of Reviews with a "notapplicable" result. 
     - **X**
     - **X**
   * - notapplicableResultEngine
     - Number of Reviews with a "notapplicable" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - unassessed
     - Total number of Reviews with a result that is NOT "pass", "fail", or "notapplicable". 
     - **X**
     -      
   * - notchecked
     - Total number of Reviews with a "notchecked" result. 
     - 
     - **X**
   * - notcheckedResultEngine
     - Number of Reviews with a "notchecked" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - unknown
     - Total number of Reviews with a "unknown" result. 
     - 
     - **X**
   * - unknownResultEngine
     - Number of Reviews with a "unknown" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - error
     - Total number of Reviews with a "error" result. 
     - 
     - **X**
   * - errorResultEngine
     - Number of Reviews with a "error" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - notselected
     - Total number of Reviews with a "notselected" result. 
     - 
     - **X**
   * - notselectedResultEngine
     - Number of Reviews with a "notselected" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - informational
     - Total number of Reviews with a "informational" result. 
     - 
     - **X**
   * - informationalResultEngine
     - Number of Reviews with a "informational" result that were evaluated by an automated tool. 
     - 
     - **X**
   * - fixed
     - Total number of Reviews with a "fixed" result. 
     - 
     - **X**
   * - fixedResultEngine
     - Number of Reviews with a "fixed" result that were evaluated by an automated tool. 
     - 
     - **X**



Aggregations Panel
------------------------

The Aggregations Panel provides various ways to navigate the Metrics data maintained by STIG Manager. This data can be presented aggregated by Asset, Labels, or STIGs by selecting the appropriate tab. Each panel allows you to drill down to the individual Assets or STIGs in those groupings. Each panel can also be exported individually as a .csv using the down-arrow icon at the bottom of each panel.

Each panel of the report presents the total number of Checks associated with each Asset or STIG across the Collection, depending on how it was grouped and what filters have been applied.  The report also lists the number of Checks with no Evaluation at all, and Checks that have been Saved, Submitted, Rejected, or Accepted as a way to gauge overall Evaluation progress of the Collection.  The total number of "Open" Severity Category 1, 2, and 3 Rules is also displayed to give an indication of the vulnerability status of the Collection.

Double-click on an item in the bottom-most panel (an individual Asset or STIG) to open up a new tab with the relevant Asset Review Workspace. 


.. thumbnail:: /assets/images/metrics-report-collection.png
      :width: 50% 
      :show_caption: True
      :title: Metrics Report


================================

.. index::
   single: Manage Collection

.. _manage-collection-workspace:

Collection Management Workspace
===================================
Allows a Collection Manager or Owner to Manage their Collection.
From this Workspace, the User can:

   * Alter the Name, Description, Settings, and Metadata associated with the Collection
   * Add/Modify/Remove User Grants in the Collection
   * Batch import CKL or XCCDF files to automatically scaffold or add to their Collection
   * Batch export CKL or XCCDF files for external tools such as eMASS
   * Add/Modify/Remove Assets in the Collection 
   * Create and Apply Labels to Assets in the Collection. 
   * Transfer Assets to another Collection
   * Add or remove STIGs from the Collection (STIGs must be assigned to at least 1 Asset to be associated with a Collection)
   * Delete the Collection (if Collection Owner)

.. thumbnail:: /assets/images/manage-collection-workspace.png
      :width: 50% 
      :show_caption: True
      :title: The Manage Collections Workspace


-------------------------------


Collection Properties Panel
--------------------------------
This Panel allows Collection Managers and Owners to change the name of the Collection, it's description, settings, grants, and any associated Metadata.  Collection Owners can also delete this Collection. 

.. thumbnail:: /assets/images/collection-properties.png
      :width: 50% 
      :show_caption: True
      :title: Collection Properties

.. _grants-panel:


Grants Tab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This Tab displays all the Users who have access to some portion of this Collection.

User Grants can be added or removed using toolbar buttons at the top of this Panel. Double-clicking a Grant will allow you to modify the Grant. When creating or modifying a Grant, typing into the Username field will display a filtered droplist of the available users. 

See :term:`User` for more info about these Access Levels.

.. thumbnail:: /assets/images/collection-manage-grants-user-pulldown.png
      :width: 50% 
      :show_caption: True
      :title: The User Grants Panel



-------------------------------

When a User with a Restricted Grant is selected, the "User access..." button is enabled. Restricted Users must be given access to specific Asset-STIG pairs. 

.. thumbnail:: /assets/images/restricted-access-list.png
      :width: 50% 
      :show_caption: True
      :title: The Restricted User Access List

|


Collection Settings Tab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you have the proper Grant to a Collection, you can modify settings that affect the behavior of this Collection and its Reviews. 


Review Fields 
++++++++++++++++++++++++++++++++++++


If you have the proper Grant to this Collection, you can set the fields that will be required for Reviews to be Submitted in this Collection. 

The default Settings for Review Submission in Collections are:
      - Always display the Detail field.
      - Require text in the Detail field in order to Submit. 
      - Display the Comment field for "Findings only".
      - Require text in the Comment field for "Findings only" in order to Submit.
      - Review must have an Evaluation Result of "Not A Finding," "Not Applicable," or "Open. (Not Configurable)
 

Review Status 
++++++++++++++++++++++++++++++++++++


Review Status Settings control the behavior of the Status fields of a Review.  Collection Owners or Managers can control whether they  want to allow certain Users to Accept or Reject reviews. The Grant levels required to do this can also be selected. 

The default Settings for Review Status are: 
      - Reset Status to "Saved" only when the Review Result changes (As opposed to ANY Review field change, such as the Detail or Comments).
      - Enable Reviews to be set to either Accepted or Rejected Status 

        * User must have "Manage or Owner" Grants to "Accept or Reject" Reviews (As opposed to just Owners)



.. thumbnail:: /assets/images/collection-manage-review-fields.png
      :width: 50% 
      :show_caption: True
      :title: Review Requirements


|

Review History
++++++++++++++++++++++++++++++++++++

Every time an individual Review for an Asset changes, a History record of its previous state is recorded.  For each Collection, Owners and Managers can now limit how many of these History records they keep for for each Review, or turn Review History off entirely

By default, the number of History records is capped at 15 for each Review. 

.. thumbnail:: /assets/images/collection-manage-review-history-setting.png 
      :width: 50% 
      :show_caption: True
      :title: Review history setting


|


.. _import-options:


Import Options
++++++++++++++++++++++++++++++++++++


The options described below allow you to have fine-grained control over how the reviews from .ckl and XCCDF files are imported into your STIG Manager Collection.  The settings specified here will become the default behavior for all users importing results from files into STIG Manager.  **This includes any instances of the STIGMan Watcher utility that may be importing into your Collection.**  

These import setting preferences can be locked for your Collection, or you can allow other users to customize them as they see fit when they perform their own imports. 


If possible, set Review status to:
  This setting allows you to set a "Goal" status for your review of Accepted, Submitted, Saved, OR, for existing reviews, to leave the status as it was, if possible. 

  - **Keep Existing**: Keep the existing Status, if possible. New reviews are set to "Saved" status. The resulting Status will also take into consideration the "Reset to Saved" configuration that is set in the Review Status section of Collection Settings. 
  - **Accepted**: If importing user has the proper grant, set Review to "Accepted." If they cannot Accept, Reviews will be set to "Submitted." If review does not meet Submit requirements, Review will be set to "Saved."
  - **Submitted**: Set Review to "Submitted" status. If review does not meet Submit requirements, Review will be set to Saved.
  - **Saved**:(**default setting**) Set Reviews to "Saved" status.


Include Unreviewed Rules:
  Should Rule Results without a compliance result (NF, NA, O) be imported?

  - **Never**: Ignore these rules. Existing STIG Manager results will not change.  
  - **Having Comments**: (**default setting**) Import these rules only if Detail or Comment is provided. Existing STIG Manager Reviews will be overwritten with the provided Result and Commentary.
  - **Always**: Always import these reviews. Replace any existing Review content.

Unreviewed with a comment is:
  If import includes reviews that do not have a compliance result (NF, NA, O), but includes Detail or Comment information, STIG Manager should import these Reviews with a Result of:

  - **Informational**: (**default setting**) Set Result to "Informational" to distinguish it from those Reviews that have no commentary. 
  - **Not Reviewed**: Leave the result as "Not_Reviewed"


Empty Detail text is:
  If the file includes Reviews with empty Detail text, the Detail text field will be:

  - **Ignored**: (**default setting**) Retain any existing Detail content already stored in STIG Manager. 
  - **Replaced**: Create a generic message indicating the fact that the imported Review had no content here. (This message will become the Detail text for the purposes of meeting submission requirements)
  - **Imported**: This will have the effect of removing any existing Detail text in STIG Manager.

Empty Comment text is:
  If the file includes Reviews with empty Comment text, the Comment text field will be:

  - **Ignored**: (**default setting**) Retain any existing Comment content already stored in STIG Manager. 
  - **Replaced**: Create a generic message indicating the fact that the imported Review had no content here. (This message will become the Comment text for the purposes of meeting submission requirements)
  - **Imported**: This will have the effect of removing any existing Comment text in STIG Manager.

Options can be customized for each import:
  Allow users to customize these import options to suit their needs. The options specified here will always be the initial settings presented to all users for this Collection. (**default: allow**)



-------------------------------


Metadata Tab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This Tab allows Users with proper access to record miscellaneous data to associate with this Collection. 

-------------------------------


.. _labels-tab:


Labels Tab
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This Tab allows you to create various Labels and apply them to Assets. Labels are specific to Collections, and will be removed from Assets if they are moved to a different Collection. Labels exist only as an organizing tool, they do not affect the processing or function of the Assets or their Reviews. 

Create a label by clicking the "New Label" button. Labels can be assigned a name, optional description, and color. 
Double-click an existing label to edit it. 

.. thumbnail:: /assets/images/collection-manage-labels.png
      :width: 50% 
      :show_caption: True
      :title: Collection Labels Tab

.. thumbnail:: /assets/images/collection-manage-new-label.png
      :width: 50% 
      :show_caption: True
      :title: Create a New Label

-------------------------------

When a Label is selected in Label tab of the Collection Properties Panel, the "Tag Assets..." button is enabled. Click the "Tag Assets..." button to view the Assets that are tagged with that label. Click the "Assign Assets" button on this screen to tag new Assets with that label. 

.. thumbnail:: /assets/images/collection-manage-tag-assets-modal.png
      :width: 50% 
      :show_caption: True
      :title: View the Assets tagged with a Particular Label

.. thumbnail:: /assets/images/collection-manage-tag-assets-assign-label-modal.png
      :width: 50% 
      :show_caption: True
      :title: Tag new Assets with a Label      

|


       
Assets Panel
------------------
This panel lists the Assets that are a part of this Collection. An Asset's properties can be modified by double-clicking on the Asset row or by choosing "Change Asset Properties..." from the toolbar.

The menu bar provides several functions, allowing the User to Create, Delete, and Change Assets in the Collection.
The :ref:`Collection Builder` option allows the User to create many Assets and their STIG Assignments at once. 

.. thumbnail:: /assets/images/assets-panel-toolbar.png
      :width: 50% 
      :show_caption: True
      :title: Collection -> Manage -> Assets toolbar

|

Click on the "Labels" column header, or any other column header, to filter the Asset grid by the data in the selected column(s).

.. thumbnail:: /assets/images/collection-manage-asset-panel-label-filtering.png
      :width: 50% 
      :show_caption: True
      :title: Asset Panel Label Filtering


-------------------------------


Create Asset
~~~~~~~~~~~~~~~
Click the Create Asset button to create an Asset manually. Enter relevant Asset info in the popup window that appears. STIGs and labels can also be assigned to the new Asset from this interface.

.. thumbnail:: /assets/images/collection-manage-asset-label-edit.png
      :width: 50% 
      :show_caption: True
      :title: Create an Asset


-------------------------------

.. index::
   single: Collection Builder

.. _Collection Builder:

Import CKL or XCCDF files to Build or Update Your Collection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

STIG Manager lets you populate your entire Collection from scratch or add to an existing Collection with a bulk import of .ckl and XCCDF files. This feature will create any new Assets you submit files for, and assign them the STIGs specified in the imported files.  If the Asset already exists, the newly imported STIGs will be assigned to them. The User can also choose whether or not to import the Reviews in the imported files, or just create the Assets and STIG Assignments.

The Asset Name must match exactly. Check the :term:`ckl` and :term:`XCCDF` glossary entries for how their individual fields map to STIG Manager fields. 

.. note::
   When STIG Manager creates an Asset from an imported file, it will populate the Name, FQDN, IP, and MAC fields if they are present in the file. If the asset is already created, those fields are NOT updated when a file is imported. 


.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the Reviews stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

Collection Builder Process
++++++++++++++++++++++++++++++++++++


From the Collection Management workspace, click the "Import CKL or XCCDF..." button at the top of the Assets panel .

.. thumbnail:: /assets/images/collection-builder-files.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder File Select

|

Drag and drop or Select one or more .ckl or XCCDF files.
See the :ref:`import-options` section of this document for information about the options presented. 

-------------------------------


.. thumbnail:: /assets/images/collection-builder-errors-and-warnings.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Errors and Warnings


|

If there is an issue with the files you selected, they will appear here. One error you may encounter is that the STIG in the selected file is not installed in STIG Manager. If this is the case, contact a STIG Manager Administrator to have them install it.

If you provide multiple files for the same Asset and STIG, only the latest will be imported. 

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

If the summary is appropriate, click the "Add to Collection..." button.

-------------------------------


.. thumbnail:: /assets/images/collection-builder-import.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Import Log

|

The user is presented with the log of the import. Select an item in the top grid for information about any "rejected" Reviews that were unable to be imported into STIG Manager. This may happen for Rules that are not currently assigned to this Asset, or for versions of STIGs that have not been loaded into STIG Manager.


.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the Reviews stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

.. note::
   STIG Manager will import and export .ckl files differently depending on the values of certain .ckl elements and Asset metadata. See :ref:`ckl-processing` for more information.    

-------------------------------


.. _export-by-asset:

Export CKLs by Asset
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export Results..." button in the Assets Panel Toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level, whole Asset level, or every Asset in the Collection. 

The user can select whether single-STIG .ckls, multi-STIG .ckls, or XCCDF files will be generated for every Asset selected. The package of files will be presented as a .zip file that will also contain a ``_manifest.json`` file describing its contents and any errors encountered while producing it.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.


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


.. _transfer-asset:

Transfer Asset(s) to Another Collection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Select one or more(with Shift+Click) Assets, click the "Transfer To" button, and select the destination Collection.  You will be prompted with a confirmation pop-up. Click "Yes" to transfer the Assets to the new Collection. 

You must have "Manage" or "Owner" levels of access on both the originating and destination Collections. You will only see Collections that you have sufficient access to in the "Transfer To" pulldown.  
Individual Asset-STIG assignments to Restricted Users are removed when an Asset is moved to a new Collection. All other information (STIG Assignments, Assessments, etc.) transfers with the Asset.  


.. thumbnail:: /assets/images/transfer-asset.png
      :width: 50% 
      :show_caption: True
      :title: Transfer Assets to Another Collection


-------------------------------


Change Asset Properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
To alter an Asset's properties or tag it with Labels, select an Asset and click this button, or double-click the Asset row.

.. thumbnail:: /assets/images/collection-manage-asset-label-edit.png
      :width: 50% 
      :show_caption: True
      :title: Asset Properties


-------------------------------

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


Export CKL or XCCDF Files by STIG
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export Results..." button in the STIGs Panel Toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level, whole STIG level, or every STIG in the Collection. 

The user can select whether single-STIG .ckls, multi-STIG .ckls, or XCCDF files will be generated for every Asset selected. The package of files will be presented as a .zip file that will also contain a ``_manifest.json`` file describing its contents and any errors encountered while producing it.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.


.. thumbnail:: /assets/images/checklist-archive-export-stig.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export by STIG



.. thumbnail:: /assets/images/checklist-archive-export-log.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export log


|


.. _ckl-processing-brief:

A Note on .CKL Processing
=================================

When the STIG Manager Client imports data from :term:`.ckl files <ckl>`, in the simplest case it will attempt to match (and, in some instances, create) the Asset specified in the .ckl's ``<HOST_NAME>`` element.  However, if the ``<ASSET><WEB_OR_DATABASE>`` element in the .ckl has a value of ``true``, special processing is invoked. This processing will attempt to match the ``<HOST_NAME>``, ``<WEB_DB_SITE>`` and ``<WEB_DB_INSTANCE>`` values in the .ckl with Asset metadata when identifying the Asset. 

See the :ref:`ckl-processing` section of this Documentation for more information. 

|

.. note::
   See the :ref:`import-options` section of this document for information about STIG Manager's review import options.  


|


