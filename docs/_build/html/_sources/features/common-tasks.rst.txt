
.. _common-tasks:



.. rubric:: STIG Manager Simplifies Common Tasks
   :class: rubric-big


######################################


Build A Collection with .ckl or XCCDF Files
===============================================

Create your Collection and go to its Collection Management workspace by selecting the "Manage" node for your Collection in the Nav Tree.
From here, select the "Import CKL or SCAP..." button in the Asset Panel, then check out the :ref:`Collection Builder` portion of our User Guide for more info.


Review a STIG on an Asset
===================================

Many STIGs do not have automated evaluations, and even after automated results are imported, many Rules may still require additional manual Evaluation.  The Asset Review Workspace in STIG Manager provides a comprehensive environment for Users to complete Evaluations of a specific STIG on an an Asset, and start engagement with the RMF Workflow by Submitting their reviews. 

Use the :ref:`Asset Review Workspace` to manually review individual STIG Rules, import results from .ckl or XCCDF files, compare Reviews to other Assets in the Collection, and to see a History of Reviews for that Asset. 


Review an entire Collection at once
=============================================

Many Collections will contain Assets that are assigned the same STIG.  The Collection Review Workspace allows Evaluators and Validators to step through each Rule in the STIG and view each Asset's Review and Status in one place. Restricted Users will only see the Assets they have been assigned, while Users with higher grants to the Collection will see every Asset.  Comments, Evaluations, and Statuses can all be edited via this interface, which also offers bulk actions for Submitting and Accepting Reviews.  This interface also provides an export option that will produce a .zip arvhive of .ckls representing the state of every Asset in the Collection that has this STIG. 

See the User Guide's section on the :ref:`Collection Review Workspace` for more information. 


Accept and Reject STIG Reviews
====================================

To help advance through the RMF process, Collection Owners (often RMF Validators) can Accept STIG Reviews at the individual :ref:`Asset Review <Asset Review Workspace>` level as well as in bulk using the :ref:`Collection Review Workspace`.  Collection Owners can also "Reject" Reviews and provide a Feedback comment to the Reviewer, which will require them to make further modification before submitting the Review again. 

Check out the :ref:`Collection Review Workspace` portion of the User Guide for more information. 


Analyze Findings and Generate a POAM
==============================================

The Findings Report provides a roll-up of every "Open" Evaluation in a Collection, and allows you to drill down into the contributing Asset Reviews.  A POA&M-style spreadsheet of these Findings can also be exported.

Check the User Guide for more information about the :ref:`Findings Report`.


Check Evaluation Progress
==============================

The :ref:`Status Report` allows Users to gauge the work involved and the progress made towards evaluating every Asset and STIG in their Collection.  

The :ref:`Status Report` also tallies the number of "Open" findings and their severity. 


Add Users
==============================

To a Collection
-------------------

If you have Manage or Owner access to a Collection, you can grant access to that Collection to other Users. 
Check ou the :ref:`User Grants <grants-panel>` section of the user guide for a description of this feature, or the :ref:`glossary <terminology>` for more information about :term:`User Access Levels. <User>`


To the System
------------------

Adding a user to STIG Manager will be dependent on the way your Organization has configured your Authentication. Check out the :ref:`Adding Users` portion of the Setup Guide for more information. 


Export Accepted Results
===============================

When a Collection has completely advanced through the STIG Manager RMF Workflow, all Reviews in a Collection should be in the Accepted state. 
You can quickly check the status of our Collection in the Collection Management screen, and create a .zip Archive of .ckl files for your entire Collection, or some portion of it.  This export will produce one .ckl file per Asset containing each STIG selected. These Multi-STIG .ckl files have been tested to be compatible with both eMASS and STIG Viewer. 

These exports are available organized :ref:`by Asset <export-by-asset>` or :ref:`by STIG. <export-by-stig>`



Update STIGs
=====================

DISA releases new STIGs every quarter (and often in-btween scheduled releases).  STIG Manager will maintain a history of STIG revisions that have been imported as long as the Benchmark ID in the STIG remains the same.  All STIG Assignments made to Assets will be preserved, and will refer to the latest version of the STIG that was imported (unless otherwise pinned to a specific Revision in the Collection [This feature is not yet fully implemented]).

Most STIG updates only change a small fraction of the Rules therein. STIG Manager tracks reviews at the Rule ID level, so in most cases a completely reviewed Asset with a new STIG will still have most of the Reviews already populated and in the same state they were in before the update. 


Download the new STIGs from DISA, and upload the STIGs you want to update using the :ref:`STIGS Import interface. <stig-import>`


Having a problem? Let us know and submit an issue on GitHub!
===================================================================

`Visit our GitHUB Issues page to submit Issues. <https://github.com/NUWCDIVNPT/stig-manager/issues>`_

