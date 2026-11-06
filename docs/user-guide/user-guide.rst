.. _user-guide-doc:



User Guide 
############################################



.. rubric:: The STIG Manager User Interface

This Document describes every part of the STIG Manager UI available to all STIG Manager Users. This guide assumes the suggested setup, in which most Users have the Collection Creator privilege. This guide also assumes that the user has some familiarity with the terms and data associated with STIGs and tools commonly used in their evaluation. For more info about the data STIG Manager manages and the terms and concepts used to describe it, check out our :ref:`glossary <terminology>` or :ref:`data and permissions document <data-and-permissions>`.

Please see the :ref:`admin-guide-doc` for Administrative functions.

The videos below may be useful in getting familiar with STIG Manager's layout and functions, though they may not be as up to date as this documentation.


.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/wv_Gdbl_LrU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

-------------------------

.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/ZwVJ0eO2d_I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

------------------------------------

|

Application Layout
======================

When first logging into STIG Manager, the User is presented with the Navigation Rail (Nav Rail) along the left edge, a breadcrumb bar across the top, and the content area that fills the rest of the window. Selecting a Collection from the Collections list in the Nav Rail opens the corresponding Collection Dashboard in the content area.

Use the Nav Rail to navigate **between** different Collections, as well as the STIG Library, What's New, and (for App Managers) the Admin section. Use the tabs across the top of the Collection Dashboard to navigate to different workspaces **within** a Collection. The breadcrumb bar always shows where you are; each segment can be clicked to move back up, and some segments are selectors (for example, to switch Collections, STIGs, or Revisions).  


.. thumbnail:: /assets/images/new/nav-tree-and-collection-panel.png
      :width: 50% 
      :show_caption: True
      :title: Nav Rail and Collection Dashboard


|

.. index::
   single: Navigation Rail

Navigation Rail
--------------------
The Navigation Rail (Nav Rail) runs along the left edge of the STIG Manager app. Click the chevron at its top to expand it and show labels, or to collapse it to icons only. The User can find all their accessible Collections via this interface, as well as the installed STIG Library and the What's New page. The Nav Rail also offers an Admin entry for those with App Management privileges. Recent Views jump back to workspaces you have visited recently.

When the Nav Rail is expanded, the Collections entry expands to show the Collections list, and Recent Views are listed at the bottom of the rail. When it is collapsed, click the Collections icon or the clock icon to open the same lists in a flyout.

The User's name and a Sign out option are in the user menu at the top right of the window. Open the user menu to view the User's Authentication Token information.

Selecting a Collection from the Collections list will open up the Collection Dashboard in the content area. If you are a Collection's Owner or Manager, a Management tab will also appear with the other tabs of the Collection Dashboard. Click it to open the Collection Management Workspace.

.. thumbnail:: /assets/images/new/nav-tree.png
      :width: 25% 
      :show_caption: True
      :title: Nav Rail

|

.. index::
   single: Collection Node

Collections
~~~~~~~~~~~~~~~~~~~~
The Collections entry of the Nav Rail expands to list all the Collections accessible to the User, as well as the Collections Dashboard entry (see :ref:`meta collection dashboard`). For those with the Collection Creator privilege, a green *+* button appears next to the Collections entry.

Create Collection
+++++++++++++++++++++
If you have the Collection Creator privilege, the *+* button will appear next to the Collections entry in the Nav Rail. Click it, enter a Name and optional Description, and click Create. You will be the Owner of the new Collection and will be taken to its Management Workspace. See the  :ref:`Manage Collection <manage-collection-workspace>` section of this document for more information about the settings available there. 

.. thumbnail:: /assets/images/new/create-collection-popup.png
      :width: 50% 
      :show_caption: True
      :title: Create Collection popup

| 

Manage Collection
+++++++++++++++++++++
If you have :term:`Manager or Owner Collection Grants <User>` on a Collection, its Collection Dashboard will include a Management tab from which you can :ref:`manage <manage-collection-workspace>` that Collection. This will allow you to add Assets, STIG Assignments, and Users to the Collection.

See :ref:`manage-collection-workspace` for more info.


Breadcrumb Bar and Content Area
-----------------------------------
The content area shows one workspace at a time, selected from the Nav Rail or from the tabs of the Collection Dashboard. Every workspace has its own URL, so the browser's Back and Forward buttons, bookmarks, and opening a workspace in a new browser tab all work as expected.

The breadcrumb bar at the top of the content area shows the current location (for example, ``Collections / Miskatonic-Lab-Linux / STIGs``). Some breadcrumb segments are selectors: the Collection segment switches between your Collections, and in the Review Workspaces the STIG and Revision segments are also available for quick navigation. The Label filter for a Collection also lives in the breadcrumb bar.

.. note::
   The legacy client opened each workspace in a tab of the Content Panel, with a "Preview" tab that was replaced by the next workspace opened. The new client has no Content Panel tabs. Instead, your recent views are available from the Recent Views list (clock icon) in the Nav Rail, and your browser's history and multiple browser tabs also work.

.. index::
   single: Home Panel


Home
--------------------
The Home page is available from the top of the Nav Rail.
This page provides links to useful information, such as this Documentation, DISA STIGs, and the RMF Process reference.
The Home page also provides information about the STIG Manager Open Source Software Project, links to the `STIG Manager OSS Project on GitHub <https://github.com/NUWCDIVNPT/stig-manager/>`_ for submitting Issues with the software, and lists the Application Managers for this instance.

.. thumbnail:: /assets/images/new/home-tab.png
      :width: 50% 
      :show_caption: True
      :title: Home Tab


What's New
--------------------
The What's New entry in the Nav Rail shows the release notes for recent STIG Manager versions. New items are also shown once on first login after an upgrade. What's New also offers an orientation tour of the layout. 



STIG Library
====================

The STIG Library entry in the Nav Rail provides tools to browse your imported Reference STIGs, and compare two Revisions of a STIG.  These features are available to all STIG Manager OSS Users, even those without specific Collection Grants. 


Browse STIGs
--------------------

The Benchmarks list on the left shows every Reference STIG stored in the STIG Manager App, with its latest Revision, rule count, and date. Select a Benchmark to list its Rules in the center panel, and use the "View" dropdown to switch between Revisions. Select a Rule to see its full content on the right.


.. thumbnail:: /assets/images/new/stig-library.png
      :width: 50% 
      :show_caption: True
      :title: STIG Library

.. thumbnail:: /assets/images/new/stig-library-selected.png
      :width: 50% 
      :show_caption: True
      :title: STIG Library with a STIG selected

|


Compare Revisions
---------------------

The "Compare Revisions" feature allows you to compare two Revisions of a STIG, and get a report of what exact Rules and fields changed between the two. With a STIG selected, choose another Revision from the "Compare with" dropdown. The grid then lists only the Rules that changed, with badges for the properties that changed in each. Select a Rule to see a line-by-line diff in the Detailed changes panel on the right. 


.. thumbnail:: /assets/images/new/stig-compare-tool.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Compare Tool

|


__________________________________


.. index::
   single: Collection Dashboard

.. _collection dashboard:

Collection Dashboard 
====================

The Collection Dashboard provides a view of the overall Status and Evaluation progress of an entire Collection, as well as metrics export options and various pivoted presentations of a Collection's assessment statistics.

From the STIGs, Assets, and Labels tabs of the Dashboard you can open individual Collection and Asset Review Workspaces. The Findings tab presents the Findings Report, and the Management tab, available to Managers and Owners, opens the Collection Management Workspace. 


.. _assessment note:

.. note::
      **For the purposes of this report, only Reviews with Not a Finding, Not Applicable, or Open Results are considered "Assessed." Those Reviews that are "Saved" with a Result other than those three do not contribute to the tallies presented here. In order to be Submitted or Accepted, a Review must have one of those 3 Results.**


.. thumbnail:: /assets/images/new/collection-panel.png
      :width: 50% 
      :show_caption: True
      :title: The Collection Dashboard

|

The components of the Collection Dashboard are described below. 


Collection Overview 
----------------------------

The Collection Overview section at the left of the Collection Dashboard provides high-level statistics about the Collection. It can be collapsed with the chevron at its top to give the grids more room. 

The Assets and STIGS presented in the Collection Dashboard can be filtered by Label using the filter in the breadcrumb bar at the top of the page. The same filter applies to every Collection Dashboard tab, to Collection Review, and to the Findings and metrics grids. Only those Assets with at least one of the selected Labels will contribute to the metrics summaries presented in this panel. 

.. thumbnail:: /assets/images/new/collection-panel-overview.png
      :width: 25% 
      :show_caption: True
      :title: Collection Overview

|


      - **Progress Chart** - Presents the proportion of Reviews that have been Assessed out of the total number of Assessments required in a Collection (ie. The total number of Rules contained in all STIGs that have been assigned to all Assets). The number of Assessed Reviews is further broken down by the Status of each of those Reviews. Depending on your process, you may want all your Reviews to wind up with an "Assessed," "Submitted," or "Accepted" status (The "Assessed" proportion here is the number of Reviews that have been "Saved" with :ref:`a valid Assessment Result <assessment note>`).  **The "Import CKL(B) or SCAP..." button in the Import Results box allows users to update their Reviews by importing .ckl(b) or XCCDF checklist files. Imports will NOT create new Assets and STIG assignments when initiated from the Collection Dashboard.**
      - **CORA** - CORA scoring is calculated from a Weighted Average that reflects the number and severity of Open or Unassessed  rules.  The CORA panel displays a count of Open or Unassessed Rules for each Severity Category, the overall Weighted Percentage, and the Risk Rating for the Collection. The Risk Rating is color-coded to indicate the level of risk, with categories ranging from Very Low to Very High. The CORA panel is responsive to the filters applied in the Dashboard. The same scoring is available more granularly in the grid displays of the STIGs, Assets, and Labels tabs. See below for more information about the CORA Score calculation.
      - **Inventory** - Total number of Assets, unique STIGs, and checklists (STIGs assigned to Assets) in this Collection. If you are a Manager or Owner for this Collection, the Management tab at the top of the Dashboard opens the :ref:`manage-collection-workspace`.
      - **Findings** - Total number of "Open" Findings in a Collection, broken down by Severity Category. Click the Findings tab at the top of the Dashboard to open the Findings Report. The Findings Report provides a way to engage with all "Open" findings in a Collection, and generate a precursor POA&M from them. See :ref:`Findings Report` for more info.
      - **Review Ages** - The age of the oldest Review in a Collection and the newest Review in a Collection. Whenever Review *content* (Result or commentary) is modified, its timestamp is updated, and this is used to calculate the ages presented here as "oldest" and "newest." The "Updated" block represents the last time the *Status* of a Review changed (ie. when a Saved, Submitted, Accepted, or Rejected status was applied).
      - **Export Metrics** - Various ways to export the data presented in this report. See below for more details. 

.. note::
      The Label filter in the breadcrumb bar applies to the Collection Overview panel and to the STIGs, Assets, Labels, and Findings tabs alike. 
      
      .. thumbnail:: /assets/images/new/collection-panel-filters.png
            :width: 50% 
            :show_caption: True
            :title: Collection Dashboard Filtering

|


CORA Score Calculation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Cyber Operational Readiness Assessment (CORA)** evaluates the effectiveness of security controls and operational processes.

**Risk Rating** is calculated from a **Weighted Average** that reflects the number and severity of *open* or *unassessed* rules.
Reviews with *Open*, *Not a Finding*, or *Not Applicable* results are considered *assessed*.
Reviews with other results (such as *Not Reviewed* or *Informational*) are treated as *unassessed*.

Each severity category (CAT I, II, III) is weighted differently when calculating the overall score:

**Weighted Average** formula:

``(p₁·w₁ + p₂·w₂ + p₃·w₃) / (w₁ + w₂ + w₃)``

where:
  - ``pₙ`` = % of open + unassessed rules in that category
  - ``wₙ`` = weight **(CAT I = 10, CAT II = 4, CAT III = 1)**

The **Risk Rating** is primarily determined by the **Weighted Average**, except for the special "Low" risk condition. If a score would be evaluated as "Moderate" but meets the requirements for "Low" risk, it is assigned "Low" risk instead:

- **Very High:** **≥ 20%**
- **High:** **≥ 10% and < 20%**
- **Moderate:** **> 0% and < 10%**
- **Low:** **CAT I = 0; CAT II & III each < 5%** *unweighted*
- **Very Low:** **0% total**


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
++++++++++++++++++++++++++++++++++++++++++

The table below describes the fields that are included in the exports available from the Collection Dashboard Metrics Export interface.  


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
   * - assessmentsLow
     - Total number of Rules assigned to this item with a Severity 3 category 
     - **X**
     - **X**
   * - assessmentsMedium
     - Total number of Rules assigned to this item with a Severity 2 category 
     - **X**
     - **X**
   * - assessmentsHigh
     - Total number of Rules assigned to this item with a Severity 1 category 
     - **X**
     - **X**
   * - assessed
     - Total number of Reviews that have been marked "pass," "fail," or "notapplicable."
     - **X**
     - **X**
   * - assessedLow
     - Number of assessed Rules with a Severity 3 category. 
     - **X**
     - **X**
   * - assessedMedium
     - Number of assessed Rules with a Severity 2 category. 
     - **X**
     - **X**
   * - assessedHigh
     - Number of assessed Rules with a Severity 1 category. 
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
   * - other
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

|

_______________________________________


Collection Checklist Navigation 
---------------------------------------

The tabs across the top of the Collection Dashboard provide various ways to navigate the Checklist data maintained by STIG Manager, as well as many useful Metrics. This data can be presented aggregated by STIGs, Assets, or Labels by selecting the appropriate tab. Each tab allows you to drill down to the individual Assets or STIGs in those groupings: selecting a row in one grid populates the grid below it. Each grid has its own Search box, Filter button, and Columns menu at its top right, and can be exported individually as a .csv using the CSV button at the bottom of the grid.

Each tab and grid of the Collection Dashboard presents the total number of Checks associated with each Asset or STIG across the Collection, depending on how it was grouped and what filters have been applied.  The grids also list the number of Checks with no Evaluation at all, and Checks that have been Saved, Submitted, Rejected, or Accepted as a way to gauge overall Evaluation progress of the Collection.  The total number of "Open" Severity Category 1, 2, and 3 Rules is also displayed to give an indication of the vulnerability status of the Collection.



.. thumbnail:: /assets/images/new/collection-panel-checklist-navigation.png
      :width: 50% 
      :show_caption: True
      :title: Checklists in the STIGs tab of the Collection Dashboard


|


STIGs Tab
-------------------------

The STIGs tab of the Collection Dashboard provides a list of every STIG that is assigned to at least one Asset in this Collection (that the User has access to).


Click the Shield icon in a STIG's row to open the :ref:`Collection Review Workspace`, from which the User can review ALL the assets they have access to for the STIG selected.

See :ref:`Collection Review Workspace` for more info.

Asset Checklists by STIG
~~~~~~~~~~~~~~~~~~~~~~~~~~
Selecting a STIG will load the Assets that have been assigned that STIG into the Checklists grid below. Click the Shield icon in an Asset's row to open the :ref:`Asset Review Workspace` for that STIG-Asset.



Assets Tab
----------------------

The Assets Tab of the Collection Dashboard provides a list of every Asset that the User has been granted access to in the Collection.

.. thumbnail:: /assets/images/new/collection-panel-assets.png
      :width: 50% 
      :show_caption: True
      :title: Checklists in the Assets tab of the Collection Dashboard


|


STIG Checklists by Asset
~~~~~~~~~~~~~~~~~~~~~~~~~~
Clicking on a particular Asset will load the bottom grid with a list of every STIG the User has access to that has been assigned to that Asset. 

Click the Shield icon in a STIG's row to open the :ref:`Asset Review Workspace` for that STIG-Asset.

Labels Tab
----------------------

The Labels Tab of the Collection Dashboard provides a list of every Label that has been assigned to an Asset that the User has been granted access to in the Collection.

.. thumbnail:: /assets/images/new/collection-panel-labels.png
      :width: 50% 
      :show_caption: True
      :title: Checklists in the Labels tab of the Collection Dashboard


|


Assets by Label
~~~~~~~~~~~~~~~~~~~~~~~~~~
Clicking on a particular Label will populate the Assets grid with a list of every Asset the User has access to that has been assigned the selected Label. 


STIG Checklists by Asset and Label
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Clicking on a particular Asset will load the bottom grid with a list of every STIG the User has access to that has been assigned to that Asset. 

Click the Shield icon in a STIG's row to open the :ref:`Asset Review Workspace` for that STIG-Asset.



===================================

.. index::
   single: Findings Report

.. _Findings Report:

Findings Tab
--------------------
The Findings Report provides a view of all Open Reviews in the Collection that the User has access to. It is the Findings tab of the Collection Dashboard, and respects the Label filter in the breadcrumb bar.

.. thumbnail:: /assets/images/new/findings-report.png
      :width: 50% 
      :show_caption: True
      :title: Findings Report


-------------------------------

Aggregated Findings
~~~~~~~~~~~~~~~~~~~~~~~~~~
The Aggregated Findings Panel provides a view of all Rule Ids that have at least one "Open" Evaluation in a Collection. By default this view is aggregated by Group ID, and includes the columns: Severity Category, Group ID, Group Title, Number of Assets, and relevant STIG.

Aggregated Findings Header
+++++++++++++++++++++++++++++
The header of the Aggregated Findings panel allows the User to filter the list by STIG, and to aggregate the view by Group, Rule, or CCI. 

Export a .csv or POA&M-style Spreadsheet
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
At the bottom of this panel are CSV and Generate POA&M... buttons.  The CSV button exports a .csv file, and the POA&M button will ask the User to set a few options and will then produce a pre-populated POA&M reference file.

POA&Ms can take different forms, and track more information than is available in STIG Manager. The POA&M output from STIG Manager is intended to be used for reference when populating your official POA&M documents with STIG finding information, and not as a replacement for artifacts that may be directly imported into eMASS or other RMF tools.


Individual Findings
~~~~~~~~~~~~~~~~~~~~~~~
Select an aggregated finding in the left panel, to bring up information about the specific assets with that finding in the Individual Findings Panel.
Information about the Asset, its Labels, the applicable STIG, the Review's Detail, Comment, origin, Status, Reviewer, and age can be found in the default columns.

This section of the Report can be exported on its own.


===================================

.. index::
   single: Meta Collection Dashboard

.. _meta collection dashboard:

Meta-Collection Dashboard 
======================================

The Meta Dashboard provides totals and metrics for some or all of your Collections at a glance. The Collections Tab shows top-level metrics for each Collection, while the STIGs tab shows metrics for each STIG across Collections. The dashboard also allows you to open up individual Collection, Asset, or STIG Review Workspaces.

Access the Meta Dashboard from the "Collections Dashboard" entry at the top of the Collections list in the Nav Rail.


.. thumbnail:: /assets/images/new/meta-collection-nav.png
      :width: 25% 
      :show_caption: True
      :title: Collections Dashboard entry in the Nav Rail

|

.. thumbnail:: /assets/images/new/meta-collection-dashboard.png
      :width: 50% 
      :show_caption: True
      :title: The Meta Dashboard


|      


Meta-Collection Overview 
----------------------------

The Meta-Collection Overview section at the left of the Meta Dashboard provides high-level statistics about your Collections. 

The Collections included in the Meta-Collection Dashboard can be filtered with the "Filter by collection" control in the breadcrumb bar. 


.. note::
      The Collection filter applies to the Overview panel and to the Collections and STIGs tabs alike. 
      
      .. thumbnail:: /assets/images/new/meta-collection-panel-overview-filters.png
                  :width: 25% 
                  :show_caption: True
                  :title: Meta-Collection Overview with Filters

|


Collections Tab
----------------------

The Collections Tab of the Meta Dashboard provides a list of every Collection that the User has been granted access to in the system.  Select a Collection to populate the STIGs grid with every STIG assigned to any Asset in that Collection. Select a STIG to see the Assets assigned that STIG. Click the Collection icon in a Collection's row to open its Collection Dashboard, or the Shield icon in an Asset's row to open its Asset Review Workspace.

.. thumbnail:: /assets/images/new/meta-collection-dashboard-collections-tab.png
      :width: 50% 
      :show_caption: True
      :title: Collections Tab of the Meta-Collection Dashboard

|


STIGs Tab
-------------------------

The STIGs tab of the Meta Dashboard provides a list of every STIG that is assigned to any Asset in any Collection that the User has access to. Selecting a STIG will load any Collections that contain Assets that have been assigned that STIG into the Collections grid below it. Selecting a Collection there will populate the Assets grid with a list of every Asset in that Collection that has been assigned the selected STIG.

.. thumbnail:: /assets/images/new/meta-collection-dashboard-stigs-tab.png
      :width: 50% 
      :show_caption: True
      :title: Collections Tab of the Meta-Collection Dashboard

|

===================================

.. index::
   single: Collection Review

.. _Collection Review Workspace:

Collection Review Workspace
==============================
The Collection Review Workspace allows the user to assess all the Assets they have access to that have been assigned the selected STIG. It can be accessed by clicking the Shield icon on a STIG in the STIGs Tab of the Collection Dashboard. The breadcrumb bar shows the Collection, STIG, and Revision, and the Label filter in the breadcrumb bar limits which Assets appear in the Reviews grid.

The workspace has three parts: the Checklist grid at the top, the Reviews grid below it, and the Rule panel on the right.

.. thumbnail:: /assets/images/new/collection-review.png
      :width: 50% 
      :show_caption: True
      :title: Collection Review Workspace


-------------------------------


Checklist Grid
--------------------
This checklist provides a list of Rules for the selected STIG, and a summary of the Evaluations associated with every Asset in the Collection.  Select a Rule in this grid to see its content in the Rule panel on the right, and to assess the individual Assets in the Reviews grid below.


Toolbar functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~
The toolbar above the checklist provides a Search box, a Filter button, a Checklist menu (Group/Rule display options and Export Result Archive), a Columns menu, and Density controls.

By default, the Collection's default Revision of the STIG is displayed. The User can select other Revisions of the STIG, if they have been imported into the system by an Admin, from the Revision selector in the breadcrumb bar. The STIG selector next to it switches to another STIG.

.. thumbnail:: /assets/images/new/collection-review-stig-revisions.png
      :width: 50% 
      :show_caption: True
      :title: STIG Revision Selection

|


Columns
~~~~~~~~~~~~~~
The columns in this panel represent the Rule Severity Category, Rule Id, Rule Title, and aggregated Review Columns for Open (O), Not a Finding (NF), Not Applicable (NA), Not Reviewed (NR), Submitted, Rejected, and Accepted. 

Additional Columns are available from the Columns menu in the toolbar, and filtering options from the Filter button. Column selections will persist for the Collection across user sessions.

.. thumbnail:: /assets/images/new/collection-workspace-checklist-ages.png
      :width: 50% 
      :show_caption: True
      :title: Column Selection

|





Rule Panel
-------------------------
The Rule panel on the right provides the content (Check, Fix, Vulnerability Discussion, and Controls) of the Rule selected in the Checklist grid.

Reviews Grid
----------------
The Reviews grid below the checklist lists the Reviews for the selected Rule for every Asset in the Collection (subject to the Label filter).
The Reviews can be Submitted, Accepted, and modified from this grid.



Toolbar functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The Reviews grid toolbar provides Accept/Reject (for Collection Managers or Owners only), Submit/Unsubmit, and Batch edit actions, plus Search, Filter, Columns, and Density controls. The Status actions apply to any Reviews selected with the checkboxes.

Review Actions
~~~~~~~~~~~~~~~~~~~~~~~
Click a Review row to open the Review editor, where the Result, Detail, Comment, and Status of that Asset's Review can be changed. Changes are saved when you select a status with the Save, Submit, or Accept button.


Batch Editing
~~~~~~~~~~~~~~~~~~~~
Select more than one Review with the checkboxes, and click the "Batch edit" button to open the Batch Editing interface.

.. thumbnail:: /assets/images/new/collection-review-batch-edit.png
      :width: 50% 
      :show_caption: True
      :title: Edit Multiple Reviews at Once with Batch Editing

|

If a User has Read-Only access to Assets in this Collection, the checkboxes for those Assets will be replaced with a read-only icon, and they will not be able to change those Reviews.

|

Review History
~~~~~~~~~~~~~~~~~~~~
Open the Review editor for an Asset and expand its Review Resources section. The History tab shows the Review History for that Asset, and the Status Text tab shows any feedback provided when the Review was Rejected. 

================================

.. index::
   single: Asset Review

.. _Asset Review Workspace:

Asset Review Workspace
====================================
The Asset Review Workspace allows you to view and modify all the Reviews for a specific STIG on the selected Asset. It also presents useful information such as the Reviews for the same Rule on other Assets, the Review's Log, and Status Text.
Users can also import and export results in .ckl or XCCDF checklist formats. 
This workspace can be accessed by clicking the Shield icon on an Asset in the STIGs, Assets, or Labels Tabs of the Collection Dashboard. The breadcrumb bar shows the Collection, Asset, STIG, and Revision.

The workspace has two parts: the Checklist grid, which fills most of the window, and the Rule panel on the right. Clicking a Rule in the Checklist opens the Review editor over the grid. 


.. thumbnail:: /assets/images/new/asset-review.png
      :width: 50% 
      :show_caption: True
      :title: Asset Review Workspace

|


-------------------------------

Checklist Grid
--------------------
The Checklist grid presents a list of the Rules associated with the selected STIG. By default, the Collection's default Revision of the STIG is displayed, along with the Severity Category, Group ID, Rule Title, Evaluation Result, Detail, Comment, Result origin, :term:`Review Status <Review>`, and age of each Review.  The "gear" column in the Checklist grid provides information about the Result stored in STIG Manager. The "user" icon indicates the Review was performed manually. The "gear" icon indicates an automated tool evaluated the Review. The arrow icon indicates an automated tool produced the result with the help of User input, such as an XCCDF Override or an Evaluate STIG Answer File. Additional Columns are available from the Columns menu in the toolbar, and status and title filters from the Filter button and Search box.

From the Checklist menu in the toolbar, the User can:
   * Choose the Group/Rule display of the Checklist grid.
   * Export a CKL, CKLB, or XCCDF representation of this Asset's STIG results.
   * Import STIG results for this Asset in .ckl, .cklb, or XCCDF form.

Switch to another STIG or Revision with the STIG and Revision selectors in the breadcrumb bar.

The toolbar also offers Submit All and Accept All buttons, and the "Writable" badge at its right indicates that the Reviews for this Asset can be changed by the User.

.. thumbnail:: /assets/images/new/asset-review-writeable.png
      :width: 50% 
      :show_caption: True
      :title: Reviews can be changed by this User.



.. note::
   STIG Manager does not retain the .ckl or XCCDF files that are imported. The files are parsed and the individual Reviews are stored in STIG Manager's Database. STIG Manager can produce a new .ckl representation of its Reviews on demand. 

.. note::
   STIG Manager will import and export .ckl files differently depending on the values of certain .ckl elements and Asset metadata. See :ref:`ckl-processing` for more information.    

Rule Panel
-------------------
The Rule panel on the right provides the text of the Rule.
It also provides information about the Controls associated with this Rule, including CCI, AP Acronym, and RMF Control.


Review Editor
----------------------------
The Review editor opens when you click a Rule in the Checklist grid, and contains the Evaluation and any required details or commentary for this Review.

Evaluation
~~~~~~~~~~~~~~~~~~
The Evaluation holds the actual Result of a compliance decision about this Rule on the selected Asset, and the required Details and/or Comment. The Results supported are: Open (O), Not a Finding (NF), Not Applicable (NA), Informational (I), and Not Reviewed (NR).  The colored badges on the attribution line at the bottom of the editor provide additional information about the source of the Result. 


Reviews can be set to Saved or Submitted statuses from this interface, and edits to the Result, Detail, and Comment are saved when a status is set. "Saved" simply indicates that the review has been logged to the system. The "Submitted" status indicates that the Evaluator considers the review to be "complete"  and may be optionally be "Accepted" or "Rejected" by a User with proper grants in the Collection.

The requirements for a Review to be set to "Submitted" status can be configured in the Collection Management Workspace by Collection Owners and Managers. Fields required for submission are marked with an asterisk in the Review editor, and the Submit button is disabled until they are satisfied. 

The default Settings for Reviews in Collections are:
      - Always display the Detail field.
      - Require text in the Detail field in order to Submit. 
      - Display the Comment field for "Findings only".
      - Require text in the Comment field for "Findings only" in order to Submit.
      - Review must have an Evaluation Result of "Not A Finding," "Not Applicable," or "Open. (Not Configurable)


Attributions
~~~~~~~~~~~~~~~

STIG Manager tracks the actual Evaluation (The Result, Detail, and Comment) portion of a Review separately from the Status (Saved, Submitted, Accepted, Rejected) portion of a Review. Information about these parts of a Review is displayed on the attribution line at the bottom of the Review editor.  

- Origin: The leftmost badge indicates whether the Result was entered manually or by an automated tool (see below).

- Evaluated: The Timestamp and User associated with the last change to the Evaluation content of the Review.

- Statused: Changes to the status of a Review (Saved, Submitted, Accepted, or Rejected), the Timestamp, and the User that made that change, are tracked separately and displayed here.

.. thumbnail:: /assets/images/new/review-attributions-panel.png
      :width: 50% 
      :show_caption: True
      :title: Review Evaluation Panel with Attributions

|

Save, Submit, and Accept Buttons
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The Status buttons on the right of the Review editor save your edits and set the status of the Review. They allow the User to simply Save the Review for later, to Submit the Review, or to Accept the Review (if they have the proper Collection Grant). On a Submitted or Accepted Review, the Save button becomes "Unsubmit". The Undo button reverts edits that have not been saved.  In most use cases, the goal for Evaluators will be to get every Review into a "Submitted" state.  Once Submitted, the Collection Owner can set the Review to "Accepted" to indicate they have ok'd it. The Collection Owner can also Reject the Review with Feedback, which will be marked so that the Reviewer can fix any issue with the commentary, or attempt to Close an Open Finding.

Review Resources
~~~~~~~~~~~~~~~~~~~~
The Review Resources section at the bottom of the Review editor can be expanded to show resources that may be useful in performing the Rule's Evaluation. Use the Apply button on a row in any of these tabs to copy that Review into the editor.


History Tab
+++++++++++++++++
The History tab displays how this Review has changed over time.

Status Text Tab
++++++++++++++++++
If this Review has been Rejected, any feedback that may have been provided by the Collection Owner is displayed here.

Other Assets Tab
+++++++++++++++++
The Other Assets tab shows Evaluations that have been performed against other Assets in the same Collection that the User has access to.


Automated "Result Engine" Information
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If a Review was imported from a source of automated assessments, such as Evaluate STIG or SCC, they may be marked as such in the UI.  The origin of Reviews (Automated, Manual, Override/Answer File) is indicated in the "gear" checklist column, and with colored badges on the attribution line of the Review editor. Hover over the badges for more info. 


.. thumbnail:: /assets/images/new/asset-review-autoresult.png
      :width: 50% 
      :show_caption: True
      :title: Asset Review Workspace with Automated Results indicated.

|

.. thumbnail:: /assets/images/new/asset-review-autoresult-with-override.png
      :width: 50% 
      :show_caption: True
      :title: Review Panel with Overridden Automated Result.

|

.. ATTENTION:: 
      If a user modifies the Result of an "Automated" Review, it will lose its Automated status. This is indicated with the replacement of the tool's badge with a "Manual" one on the attribution line, and the absence of the gear symbol for that rule in the Checklist grid. 


==============================

.. index::
   single: Manage Collection

.. _manage-collection-workspace:

Collection Management Workspace
===================================
Allows a Collection Manager or Owner to Manage their Collection.
From this Workspace, the User can:

   * Alter the Name, Description, Settings, and Metadata associated with the Collection
   * Add/Modify/Remove Grants and Access Control Lists for Users and User Groups in the Collection
   * Batch import CKL or XCCDF files to automatically scaffold or add to their Collection
   * Batch export CKL or XCCDF files for external tools such as eMASS
   * Add/Modify/Remove Assets in the Collection 
   * Create and Apply Labels to Assets in the Collection. 
   * Transfer Assets to another Collection
   * Add or remove STIGs from the Collection (STIGs must be assigned to at least 1 Asset to be associated with a Collection)
   * Delete the Collection (if Collection Owner)

The Workspace is organized into five pages, selected with the buttons at its top right: Configuration, Users & Grants, Assets, STIGs, and Labels. The Configuration page is further divided into Properties, Review Settings, Import Options, Actions, and Danger Zone sections, listed on its left.

.. thumbnail:: /assets/images/new/manage-collection-workspace.png
      :width: 50% 
      :show_caption: True
      :title: The Manage Collections Workspace


-------------------------------


Configuration Page
--------------------------------
The Configuration page allows Collection Managers and Owners to change the name of the Collection, its description, settings, and any associated Metadata. Changes are saved automatically as you edit.  Collection Owners can also delete this Collection from the Danger Zone section. 

Properties
~~~~~~~~~~~~~~~~~~~~
The Properties section holds the Collection's Name and Description.

.. thumbnail:: /assets/images/new/collection-properties.png
      :width: 50% 
      :show_caption: True
      :title: Collection Properties

|

Metadata
++++++++++++++++++++

The Metadata form in the Properties section of the Configuration page allows Users with proper access to record miscellaneous key-value data to associate with this Collection. 

Review Settings
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you have the proper Grant to a Collection, you can modify settings that affect the behavior of this Collection and its Reviews from the Review Settings section of the Configuration page. 


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



.. thumbnail:: /assets/images/new/collection-manage-review-fields.png
      :width: 50% 
      :show_caption: True
      :title: Review Requirements


|

Review History
++++++++++++++++++++++++++++++++++++

Every time an individual Review for an Asset changes, a History record of its previous state is recorded.  For each Collection, Owners and Managers can now limit how many of these History records they keep for for each Review, or turn Review History off entirely

By default, the number of History records is capped at 15 for each Review. 

.. _import-options:


Import Options
~~~~~~~~~~~~~~~~~~~~


The Import Options section of the Configuration page allows you to have fine-grained control over how the reviews from .ckl and XCCDF files are imported into your STIG Manager Collection.  The settings specified here will become the default behavior for all users importing results from files into the collection.  **This includes any instances of the STIGMan Watcher utility that may be importing into your Collection.**  

These import setting preferences can be locked for your Collection, or you can allow other users to customize them as they see fit when they perform their own imports. 

.. thumbnail:: /assets/images/new/collection-manage-review-import-options.png
      :width: 50% 
      :show_caption: True
      :title: Review Import Options Fields
      
|


Review Status Per Result:
  This setting allows you to define the desired Review Status—Accepted, Submitted, Saved, or Keep Existing if possible (for existing reviews)—for each result type: Fail, Not Applicable, or Pass.
  
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

Actions
~~~~~~~~~~~~~~~~~~~~
The Actions section of the Configuration page holds the Clone Collection and Tasks forms.

.. _clone-collection:


Clone Collection
++++++++++++++++++++

The Clone Collection form in the Actions section of the Configuration page allows Managers or Owners to create another Collection that is a copy of the one they are currently viewing.  
This feature can be useful for creating a "snapshot" of a Collection at a particular point in time that could be used to support certain process or reporting needs. At clone time, the new Collection can be created with all its STIGs "pinned" to the default Revisions of the Source Collection, which will ensure the Clone's reviews and metrics do not change when Reference STIGs are updated. 


.. thumbnail:: /assets/images/new/collection-manage-clone-button.png
      :width: 50% 
      :show_caption: True
      :title: The Collection Clone Button

|

The new Collection can be substantially identical to the original, but must have a different name.

The clone always includes the original Collection's Assets, their core properties, their Labels, and their STIG assignments. Users can choose whether to copy Reviews, whether to copy the User Grants from the original Collection into the new one, and how STIG Revisions are pinned in the clone.

.. note::
   Whether or not the User Grants are copied, the User who created the new Collection will be an Owner of the new Collection.


.. thumbnail:: /assets/images/new/collection-manage-clone-options.png
      :width: 50% 
      :show_caption: True
      :title: Collection Clone Options

|

Once the clone operation has started, a progress notification will appear.  The User can continue to use STIG Manager while the clone operation is in progress. The notification will update when the clone is complete, with links to the new Collection.


.. warning::
      Large Collections can take several minutes to clone! During this time, Users will likely see a performance impact when accessing the source Collection. Making changes to the source Collection while it is being cloned may lead to inconsistent results in the cloned Collection.
      
      You may want to alert your users before cloning a large Collection.

|

.. _review-aging-rules:

Review Aging
++++++++++++++++++++

Review Aging allows Collection Owners to define rules that automatically act on reviews that have not been updated within a configurable time period. Rules are processed by the **Update Aged Reviews** system job, which is scheduled and enabled by an App Manager.

Collection Managers can view the configured rules and task output. Only Collection Owners can create, edit, or delete rules.

Access Review Aging configuration from the **Tasks** form in the **Actions** section of the Configuration page. Select the **ReviewAging** task from the Task dropdown to display the rules grid and current schedule summary.

.. important::
   Rules defined here will not act on any reviews unless the **Update Aged Reviews** system job is enabled and scheduled by an App Manager. Coordinate with your App Manager to confirm the job is running on a cadence appropriate for your rules.


.. thumbnail:: /assets/images/new/collection-manage-tasks.png
      :width: 35% 
      :show_caption: True
      :title: Review Aging Task


.. rubric:: Rules and Ordinal

A collection can have multiple rules, processed in ordinal order. Rules are independent — each rule scans the collection's reviews separately without awareness of other rules.

.. rubric:: Creating a Rule

.. thumbnail:: /assets/images/new/collection-manage-review-aging-rule.png
      :width: 35% 
      :show_caption: True
      :title: Review Aging Rule


Click **New Rule** (Owners only) to open the rule editor. Each rule has three sections:

**Trigger**

Defines which reviews are eligible and when:

- **Trigger field** — The review timestamp to evaluate:

  - *Review timestamp* (``ts``) — When the review content (result or detail text) was last changed.
  - *Status timestamp* (``statusTs``) — When the review status (Saved, Submitted, Accepted, Rejected) was last changed.
  - *Touch timestamp* (``touchTs``) — When any aspect of the review was last touched (latest of the two above).

- **Interval** — The age threshold. Reviews where the trigger field is older than this value   are eligible. Expressed in days, hours, minutes, or seconds.

**Action**

Defines what happens to eligible reviews:

- **Delete** — Permanently removes the review and its history records.
- **Update** — Modifies a field on the review:

  - *Set status to Saved* — Resets the review status to Saved.
  - *Set status to Submitted* — Sets the review status to Submitted.
  - *Set result to Not Checked* — Changes the result to Not Checked and resets status to Saved.
  - *Set result to Informational* — Changes the result to Informational and resets status to Saved.

.. note::
   Update actions that change the result will also reset the review status to Saved, regardless of its current status.

.. note::
   Update actions skip reviews already in the target state. For example, a "Set status to Saved" rule will not reprocess reviews that are already Saved.

**Target**

Optionally restricts which reviews the rule applies to. If no target is set, the rule applies to all reviews in the collection. Available targets:

- **Entire collection** (no target) — All reviews on all assets and STIGs.
- **Asset** — All reviews on a specific asset, across all assigned STIGs.
- **Asset + STIG** — Reviews on a specific asset for a specific STIG only.
- **Label** — Reviews on any asset carrying a specific collection label.
- **Label + STIG** — Reviews on labeled assets for a specific STIG only.
- **STIG** — All reviews for a specific STIG across the entire collection.

.. rubric:: Managing Rules

- **Reorder** — Use the up/down arrows on each row to change processing order (ordinal).
- **Edit** — Click the edit icon or double-click a row to modify a rule.
- **Enable/Disable** — Rules can be toggled without deleting them. Disabled rules are skipped at runtime.
- **Delete** — Click the trash icon to remove a rule permanently.

.. rubric:: Viewing Task Output

Click **Task Output...** to open the output log for this collection's aging task runs. The log shows progress per batch processed, including how many reviews were acted on. Use this to confirm rules are matching the expected reviews and to diagnose unexpected results.

-------------------------------

Danger Zone
~~~~~~~~~~~~~~~~~~~~
Collection Owners can delete the Collection from the Danger Zone section. A confirmation is required before the Collection and all its Assets, Reviews, and Grants are removed.

-------------------------------

Users & Grants Page
-----------------------
The Users & Grants page is divided into the Grants and Effective Users sections.

.. _grants-panel:


Grants
~~~~~~~~~~~~~~~~~~~~

The Grants section of the Users & Grants page displays all the Users and Groups that have been given a Grant to some portion of this Collection.

User/Group Grants are added with the "Add Grants..." button at the top of the Grants grid. Each Grant row has a "target" icon to change the Access Control List applied to the Grant, a "pencil" icon to change the User or Role associated with the Grant, and a "trash" icon to remove the Grant.

You can expand individual Groups listed in the "Available Grantees" panel to see the Users in that Group.

See the :ref:`Roles and Access<roles-and-access>` section for more information about Grants, Roles, and Access Control.

.. thumbnail:: /assets/images/new/collection-manage-new-grants-popup.png
      :width: 50% 
      :show_caption: True
      :title: The User Grants Panel


.. thumbnail:: /assets/images/new/collection-manage-edit-grant.png
      :width: 50% 
      :show_caption: True
      :title: Edit or reassign an existing Grant

-------------------------------

Every Grant is associated with a User or Group, an Access Control List, and Role in the Collection.  The Access Control List can be used to restrict or expand the Grant's access to certain Assets, STIGs, or Labels in the Collection.  By default, the Full, Manage, and Owner Roles have Read/Write access to all Reviews in a Collection, and the Restricted Role has no access to any Reviews.  The Access Control List can be used to further restrict or expand access for any of these Roles.

Managers and Owners have additional Collection capabilities that let them add or remove Assets, STIG assignments, and Grants to the Collection. 
See the :ref:`Roles and Access<roles-and-access>` section for more information about Grants, Roles, and Access Control.


.. thumbnail:: /assets/images/new/collection-manage-acl-popup.png
      :width: 50% 
      :show_caption: True
      :title: The Access Control List Popup

|



.. _users-panel:

Effective Users
~~~~~~~~~~~~~~~~~~~~

The Effective Users section displays all the Users that have been granted access to this Collection, with either a Direct Grant to the User or via a Grant to a User Group. Click the "target" icon at the end of a User's row to view an expanded list of every Asset and STIG that the User has access to in this Collection. This view is the "effective access" of the User to the Collection that has been calculated based on the User's Role and the Access Control Lists associated with their Grant.


.. thumbnail:: /assets/images/new/collection-manage-effective-access.png
      :width: 50% 
      :show_caption: True
      :title: Users Effective Access

|

-------------------------------


Assets Page
------------------
The Assets page lists the Assets that are a part of this Collection, with their Labels and assessment metrics. An Asset's properties can be modified by selecting the Asset and clicking "Modify" in the toolbar.

The toolbar provides Create, Import Assets CSV, Export Assets CSV, Import CKL(B) or XCCDF..., Export results..., Delete, Transfer To, and Modify functions.
The :ref:`Collection Builder` option allows the User to create many Assets and their STIG Assignments at once. 

.. thumbnail:: /assets/images/new/assets-panel-toolbar.png
      :width: 100% 
      :show_caption: True
      :title: Collection -> Manage -> Assets toolbar

|

Use the Search box, the Filter button, and the Columns menu above the grid to filter the Asset grid by Label or any other column, and to choose which columns are shown.

.. thumbnail:: /assets/images/new/collection-manage-asset-panel-label-filtering.png
      :width: 50% 
      :show_caption: True
      :title: Asset Panel Label Filtering


-------------------------------


Create Asset
~~~~~~~~~~~~~~~
Click the Create button to create an Asset manually. Enter relevant Asset info in the popup window that appears. Labels, Metadata, and STIGs can also be assigned to the new Asset from this interface.

.. thumbnail:: /assets/images/new/collection-manage-asset-label-edit.png
      :width: 50% 
      :show_caption: True
      :title: Create an Asset


-------------------------------

Create Asset Batch
~~~~~~~~~~~~~~~~~~~~~~~

Example CSV File that can be used to create multiple Assets at once:  
:download:`Download Sample Asset CSV </user-guide/Stig-Manager-Asset-Batch-Import.csv>`

The uploaded CSV must follow this format:

.. list-table:: 
   :header-rows: 1

   * - Column Name
     - Description
     - Data Requirements
   * - Name
     - The name of the asset
     - (Required) Must be between 1 and 255 characters long. 
   * - Description
     - Description of the asset
     - (Optional) 255 characters max, any characters over 255 will be truncated
   * - IP
     - The IP address of the asset
     - (Optional) 255 characters max, any characters over 255 will be truncated
   * - FQDN
     -  Fully Qualified Domain Name of the asset
     - (Optional) 255 characters max, any characters over 255 will be truncated
   * - MAC
     - The MAC address of the asset
     - (Optional) 255 characters max, any characters over 255 will be truncated
   * - Non-Computing
     - Indicates if the asset is a non-computing device
     - (Optional) Will default to FALSE if not provided. Valid values are TRUE or FALSE.
   * - STIGs
     - The STIGs to be assigned to the asset
     - (Optional) Newline separated list of STIG BenchmarkIds. STIG installed in STIG Manager before they can be assigned to an Asset.
   * - Labels
     - The labels to be assigned to the asset
     - (Optional) Newline separated list of Label Names. Labels in the file will be created if they do not already exist in the Collection.
   * - Metadata
     - The metadata to be assigned to the asset
     - (Optional) JSON-encoded object for key-value metadata. Only one layer deep is supported. The keys and the values must be strings. The keys must be unique within the object.


Click Import Assets CSV to create Assets from a CSV file. 

.. thumbnail:: /assets/images/new/collection-manage-csv-batch-create.png
      :width: 50% 
      :show_caption: True
      :title: Select 'Import Assets CSV' button


Begin by selecting a CSV that contains asset data. Once uploaded, the importer parses each row, validating the entries before proceeding. Only rows with valid data are considered for submission — any invalid rows are automatically ignored for submission with the respective errors on that row shown. During validation, the importer checks for non-existing labels referenced in the CSV and automatically marks them to be created upon submission. After validation completes, the user can submit the data. Submission is only enabled if at least one valid asset is detected.

.. thumbnail:: /assets/images/new/collection-manage-asset-csv-importer.png
      :width: 50% 
      :show_caption: True
      :title: View the Report of the Asset CSV Importer


-------------------------------------------------------------------------------------------


Export Assets CSV File
~~~~~~~~~~~~~~~~~~~~~~~~

To Export Assets as CSV, select one or more Assets (no assets selected will imply all assets), and click the "Export Assets CSV" button. The CSV export will contain the Asset Name, Description, IP, FQDN, MAC, Non-Computing, STIGs, Labels, and Metadata. The CSV will also contain the STIGs assigned to each Asset in the Collection.

.. thumbnail:: /assets/images/new/collection-manage-results-export-assets-csv.png
      :width: 50% 
      :show_caption: True
      :title: Export Assets CSV Button

|

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


From the Assets page of the Collection Management workspace, click the "Import CKL(B) or XCCDF..." button in the toolbar.

.. thumbnail:: /assets/images/new/collection-builder-files.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder File Select

|

Drag and drop files, folders, or ZIP archives of .ckl, .cklb, or XCCDF files onto the queue, or click "Add files to queue..." to select them. Check "Custom Options" to change the Import Options for this import (if the Collection allows it), then click Continue.
See the :ref:`import-options` section of this document for information about the options presented. 

-------------------------------


.. thumbnail:: /assets/images/new/collection-builder-errors-and-warnings.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Errors and Warnings


|

If there is an issue with the files you selected, they will appear here. One error you may encounter is that the STIG in the selected file is not installed in STIG Manager. If this is the case, contact a STIG Manager Administrator to have them install it.

If you provide multiple files for the same Asset and STIG, only the latest will be imported. 

This screen will be skipped if there are no issues with the files you have selected.

-------------------------------

.. thumbnail:: /assets/images/new/collection-builder-options.png
      :width: 50% 
      :show_caption: True
      :title: Collection Builder Options and Summary


|

You will be presented with a summary view of the files you have submitted.
This view shows the Assets, STIGs, Review totals, filenames and date of the data contained in the submitted files. 

New Assets and new STIG assignments that will result from this import are indicated with a (+) after the Asset or STIG name.

If the summary is appropriate, click the "Add to Collection..." button.

-------------------------------


.. thumbnail:: /assets/images/new/collection-builder-import.png
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

Export Results by Asset
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export results..." button in the Assets page toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level, whole Asset level, or every Asset in the Collection.

When Assets have been pre-selected on the Assets page, only the selected Assets will be presented in the checkbox selection tree.

Use the "Export to" radio buttons (Zip archive or Collection) at the bottom of the pop-up to select the type of export you would like to perform.

Export Results to Another Collection
+++++++++++++++++++++++++++++++++++++++++++++++

The user can export results from Assets in the current Collection to another Collection. The user must have "Manage" or "Owner" levels of access in the destination Collection. You will only see Collections that you have sufficient access to in the "Export To" pulldown.
If the destination Collection does not have an Asset of the same name as the one being exported, a new Asset will be created in the destination Collection. If the destination Collection already has an Asset of the same name, any STIGs that are not already assigned to the Asset in the destination Collection will be assigned to it.  Any STIGs that are already assigned to the Asset in the destination Collection will be updated with the new results in accordance with the Collection settings of the destination.

.. note::
      The "Export Results to Another Collection" option is limited to a maximum of 100 Assets at one time.



.. thumbnail:: /assets/images/new/collection-manage-results-export-asset-collection.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export by Asset

|



Export Results as CKL or XCCDF Archive
+++++++++++++++++++++++++++++++++++++++++++++++

Use the Format dropdown to select whether CKL, CKLB, or XCCDF files will be generated for every Asset selected, then click "Download archive". The package of files will be presented as a .zip file that will also contain a ``_manifest.json`` file describing its contents and any errors encountered while producing it.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.

.. thumbnail:: /assets/images/new/collection-manage-results-export-asset-archive.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export


|

--------------------------

Delete Asset
~~~~~~~~~~~~~~~~~~~~
To Delete an Asset, select an Asset and click the Delete button. A popup will ask you to confirm the action. 


.. _transfer-asset:

Transfer Asset(s) to Another Collection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Select one or more Assets with the checkboxes, click the "Transfer To" button, and choose the destination Collection from the menu.  You will be prompted with a confirmation pop-up. Click "Yes" to transfer the Assets to the new Collection. 

You must have "Manage" or "Owner" levels of access on both the originating and destination Collections. You will only see Collections that you have sufficient access to in the "Transfer To" pulldown.  
Individual Asset-STIG assignments to Restricted Users are removed when an Asset is moved to a new Collection. All other information (STIG Assignments, Assessments, etc.) transfers with the Asset.  


.. thumbnail:: /assets/images/new/transfer-asset.png
      :width: 50% 
      :show_caption: True
      :title: Transfer Assets to Another Collection


-------------------------------


Change Asset Properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
To alter an Asset's properties or tag it with Labels, select an Asset and click the Modify button.

.. thumbnail:: /assets/images/new/collection-manage-asset-label-edit.png
      :width: 50% 
      :show_caption: True
      :title: Asset Properties


-------------------------------

STIGs Page
-------------------
The STIGs page lists all the STIGs that have been assigned to at least one Asset in the Collection. STIG Assignments can be added or removed from Assets with the Assign, Unassign, and Modify buttons at the top of this page. You can also "pin" a specific Revision of a STIG to the Collection. This will lock this Collection to that specific Revision of a STIG, rather than use the default behavior of always using the latest Revision of a STIG.

.. thumbnail:: /assets/images/new/stigs-panel.png
      :width: 50% 
      :show_caption: True
      :title: STIGs Panel


-------------------------------


Assign STIG
~~~~~~~~~~~~~~~~~~~~~~
Click Assign to add a new STIG to the Collection. In the popup, choose the Benchmark ID (and optionally a Default Revision), then move Assets between the Available and Assigned lists. Each Asset shows its Labels and a count of its currently assigned STIGs, and the search boxes filter by Asset name, Label, or STIG. Click Assign to save.

.. thumbnail:: /assets/images/new/stig-assignments.png
      :width: 50% 
      :show_caption: True
      :title: STIG Assignments


-------------------------------


.. _pin-revision:

Set a Default STIG Revision
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can "Pin" a specific Revision of a STIG to the Collection. This will lock this Collection to that specific Revision of a STIG, rather than use the default behavior of always using the latest Revision of a STIG. This will affect all calculated Metrics as well as the initial Revision of a STIG presented in all Workspaces.

.. note::
   "Latest" is determined by the highest version+release among imported Revisions whose ``status`` is not ``draft`` (i.e. ``accepted``, ``deprecated``, ``sunset``, etc. all compete equally). If DISA publishes a higher-numbered Revision with a ``deprecated`` status, that Revision will be treated as the default. Revisions with a ``draft`` status are held back and only chosen if no non-draft Revision exists. Pin a specific Revision here to override this behavior for this Collection.


To set a specific default Revision of a STIG for a Collection, select the STIG on the STIGs page and click "Modify" (or use "Assign" when adding a new STIG). Select the desired Revision from the "Default Revision" dropdown menu, and click "Save."  To revert to the default behavior, select "Most recent revision" from the dropdown menu and click "Save."

The Save action may take a moment, as STIG Manager will need to recalculate all metrics based on the new Revision.

The "pinned" Revision is indicated with a pin icon on the STIGs page and in the Collection Dashboard.

.. note::
    A STIG must be assigned to at least one Asset in a Collection in order to be Pinned!



.. thumbnail:: /assets/images/new/collection-manage-revision-pinning.png
      :width: 50% 
      :show_caption: True
      :title: Pin a STIG Revision

-------------------------------


Unassign STIG
~~~~~~~~~~~~~~~~~~~~~
The Unassign button will remove the selected STIG from all Assets that are assigned it in this Collection.



Change Assigned Assets
~~~~~~~~~~~~~~~~~~~~~~~~
Select a STIG and click "Modify" to change what Assets are assigned this STIG in this Collection.


.. _export-by-stig:


Export Results by STIG
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The "Export results..." button in the STIGs page toolbar will open a pop-up interface with a checkbox selection tree.  Selections can be made for any combination in the tree, from the individual STIG-Asset level or every Asset in the Collection.

When STIGs have been pre-selected on the STIGs page, only the selected STIGs will be presented in the checkbox selection tree.

Use the "Export to" radio buttons (Zip archive or Collection) at the bottom of the pop-up to select the type of export you would like to perform.

Export Results to Another Collection
+++++++++++++++++++++++++++++++++++++++++++++++

The user can export results from STIGs in the current Collection to another Collection. The user must have "Manage" or "Owner" levels of access in the destination Collection. You will only see Collections that you have sufficient access to in the "Export To" pulldown.
If the destination Collection does not have an Asset of the same name as the one being exported, a new Asset will be created in the destination Collection. If the destination Collection already has an Asset of the same name, any STIGs that are not already assigned to the Asset in the destination Collection will be assigned to it.  Any STIGs that are already assigned to the Asset in the destination Collection will be updated with the new results in accordance with the Collection settings of the destination.

.. note::
      The "Export Results to Another Collection" option is limited to a maximum of 100 Assets at one time.



.. thumbnail:: /assets/images/new/collection-manage-results-export-asset-collection.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export by Asset

|



Export Results as CKL or XCCDF Archive
+++++++++++++++++++++++++++++++++++++++++++++++

Use the Format dropdown to select whether CKL, CKLB, or XCCDF files will be generated for every Asset selected, then click "Download archive". The package of files will be presented as a .zip file that will also contain a ``_manifest.json`` file describing its contents and any errors encountered while producing it.  Check the :term:`ckl` glossary entry for exact mappings of fields from STIG Manger to .ckl file.

.. thumbnail:: /assets/images/new/collection-manage-results-export-asset-archive.png
      :width: 50% 
      :show_caption: True
      :title: Checklist Archive Export


|

.. _labels-tab:


Labels Page
--------------------

The Labels page allows you to create various Labels and apply them to Assets. Labels are specific to Collections, and will be removed from Assets if they are moved to a different Collection. Labels exist only as an organizing tool, they do not affect the processing or function of the Assets or their Reviews. 

Create a label by clicking the "Create" button. Labels can be assigned a name, optional description, and color.
Select an existing label and click "Edit" to change it. 

.. thumbnail:: /assets/images/new/collection-manage-labels.png
      :width: 50% 
      :show_caption: True
      :title: Collection Labels Tab

|      

.. thumbnail:: /assets/images/new/collection-manage-new-label.png
      :width: 50% 
      :show_caption: True
      :title: Create a New Label

-------------------------------

When a Label is selected on the Labels page, the "Tag Assets" button is enabled. Click it to view and tag Assets with the selected Label.

.. thumbnail:: /assets/images/new/collection-manage-tag-assets-modal.png
      :width: 50% 
      :show_caption: True
      :title: View and tag Assets with the selected Label

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


