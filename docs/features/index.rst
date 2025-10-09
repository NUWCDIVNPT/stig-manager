
.. _features-index:

Introduction and Features
############################

.. _Introduction:


What is STIG Manager?
======================

STIG Manager is an Open Source API and Web client for managing the assessment of Information Systems for compliance with `security checklists <https://public.cyber.mil/stigs/>`_ published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists `distributed <https://public.cyber.mil/stigs/downloads/>`_ as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG) in the XCCDF format.

Our Project incorporates software developed since 2012 by the `U.S. Naval Undersea Warfare Center Division Newport (NUWCDIVNPT) <https://www.navsea.navy.mil/Home/Warfare-Centers/NUWC-Newport/>`_. More information, and the software itself, is available on GitHub: `STIG Manager <https://github.com/NUWCDIVNPT/stig-manager/>`_



The Single Source of Truth throughout Steps 3 and 4 of the RMF Process
===========================================================================================

Throughout the RMF process, STIG Manager serves as the single source of truth for users, evaluators, managers, RMF Package reviewers, ISSEs, NQVs, and automated tools about Assets, STIGs, and their current assessment status.  By allowing everyone involved in the process to refer to the same set of data and reports, the RMF process can be executed efficiently and its progress monitored effectively.  STIG Managers API allows automated tools to submit scan results, as well as access data for direction on what STIGs they should scan.

STIG Manager provides data structures, assessment workspaces, and Reports for managing these Steps of the RMF process.  


.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/wv_Gdbl_LrU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

--------------------


Features and Capabilities Overview
====================================


STIG Evaluation Data, Freed From .CKL Files
----------------------------------------------------

STIG Manager maintains a canonical set of STIGs as published by DISA, and relates all Reviews to that set. Working with this data directly in STIGMan, rather than passing .ckl files around, eliminates the possibility of STIG Evaluators using the wrong STIG revision, changing severity, creating malformed .ckls, and other issues that can hamper the efficient flow of Evaluations to Validators.  STIG Manager will import .ckl files and create Reviews that match their contents. Any remaining Evaluation gaps can be reviewed manually in the STIGMan interface, or added to with additional imports. STIGMan provide a unified view of overall Evaluation progress, and are not tied to any specific .ckl file.  

Instead of relying on .CKL files that could be altered, overridden, or have missing fields, properly formed .CKLs are generated from the current Evaluation state of Assets. Once Validators verify that all reviews are as they want them, they can create an archive of .CKLs on demand for import into eMASS. 


RMF Package data represented as Collections, Assets, STIGs, and Reviews
----------------------------------------------------------------------------------

STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * Reviews of the Rules that compose each attached STIG
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reports providing Status and Findings information


Create Collections From Your Existing .CKL Files
------------------------------------------------------------
  
Migrating to STIG Manager is easy because it can use your existing artifacts to build and update Collections. Assets, STIGs, and Reviews can be populated with the .ckls produced by STIG Viewer or the automated STIG assessments in XCCDF format produced by the SCC tool, as well as manually from the Collection Configuration tab.  Once a Collection is created in STIG Manager, Users can be granted access to see the current results for each STIG on an Asset, or the whole Collection. Users can see automated tool evaluations, and Rules that still require evaluation.

.. note::
  STIG Manager does not maintain a repository of uploaded checklists. Instead, it maintains a current state of evaluations for an asset, and will create new .ckls for you on demand with the most current results.


-------------------------

Workspaces for Understanding and Tracking Your Evaluation Data
-------------------------------------------------------------------------------------

The STIG Manager Client provides efficient workspaces for creating Collections of Assets and their associated STIGs, and assigning specific Users to evaluate those STIGs. User tasking can be managed in real time by granting Collection roles with varying levels of access, down to individual STIGs on specific Assets. Users have access to efficient STIG Review workspaces that provide resources to guide their evaluations, such as their previous answers for other Assets, as well as allow them to evaluate multiple Assets at once.  Every User gets real time reports and statistics about their progress and the status of their Reviews, scoped to their level of access in each Collection. 


.. raw:: html

  <iframe width="560" height="315" src="https://www.youtube.com/embed/ZwVJ0eO2d_I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

-------------------


Sophisticated Algorithm Tracks Reviews Across STIG Revision Changes, Eliminating Redundant Work
---------------------------------------------------------------------------------------------------

STIG Manager tracks Reviews using the Rule Version and Rule Check Content, so that When STIGs are updated, all Reviews for Rules with unchanged content are carried forward to the new STIG. This allows STIG Evaluators to focus on the Rules that have changed, and not repeat work that has already been done.

See our section on :ref:`Review Handling and Matching<review-handling>` for more information about how STIGMan tracks Reviews.

Customizable Review Requirements to Help Progress Towards a POA&M
---------------------------------------------------------------------

STIG Manager supports customizable Review Requirements that allow designated Collection Owners to "Reject" Reviews to evaluators for further revision or clarification, such as when a Finding requires further Detailing. Collection Owners can also "Accept" a Review, potentially marking it as a candidate for their POA&M. 

Reporting on Findings and Evaluation Status
---------------------------------------------------

Reports adjust as new STIGs are assigned, results imported, or when new DISA STIG revisions are imported, to provide information on the status and progress of evaluations.

The Collection Configuration workspace provides real-time totals for level of work required as changes to Assets and STIGs are made.

User Access Controls to Limit Access to Your Data
-----------------------------------------------------------

STIG Manager provides granular Role-Based Access Controls that can give Users access to some or all of the Assets and their STIGs in a Collection.

STIG Manager is CCI-aware
-----------------------------------

STIG Manager maintains relationships between STIG Rules and their associated CCIs and Assessment Procedures. Reports can be pivoted to show Open Findings sorted by Rule, CCI, or Group.

STIG Manager can produce a pre-populated POA&M-style spreadsheet that lists findings already decomposed into their related CCIs. 


STIG Manager Integrates with the Continuous RMF Lifecycle approach
----------------------------------------------------------------------

STIG Manager is ready to support a life-cycle approach to RMF. Your most current STIG Assessments are always available in STIGManager. When new STIGs are released, system or SAP changes occur, or new STIGs are applied, only the new content needs to be assessed.  STIG Manager also timestamps every review, to help determine compliance with the Continuous Evaluation approach. STIG Manager also maintains a history of every Review performed so Review changes over time can be referenced.



..
  Collaborate on Steps 3 and 4 of the RMF Process
  ===================================================

  STIGMan separates your evaluation data from the .ckls that previously contained them. 
  Instead of sending .ckls around ahving to check that they are in order, perfect .ckls are generated on demand.
  STIG Manager produces .ckls that represent 

  Based off a canonical STIG, so you don't have to worry if the .ckl STIG is altered.


  Collaborate on STIG Evaluation and management. Make use of others expertise.

  Collaboratively manage your STIG assessments.

  Single source of truth for all parties to reference. 

  Multiple workspaces for different user approaches and responsibilitiies.

  Multiple workspaces for each 

  organize and perform STIG evaluations
  Collection Management
  Asset
  STIG Evaluations
  Approve evaluations
  Report on Status, Progress, and Findings.
  Analyze Evaluation progress.

  Complete API

  Role and Assignmnet based access controls

  combine inputs from individuals and automated results



  STIG Manager serves as a central reference for current STIG Assignments, Evaluations, and progress for all parties involved in Package creation. 


  Rather than passing .ckl files around, which, by their nature, are instantly out of date, STIG Manager provides the authoritative source for current STIG Evaluations and Package progress. 


  Evaluate, validate, and check status of an entire Package at once. Track exactly when an Evaluation was last performed, both from automated, imported results and manual entries. 


  Import XCCDF results or .ckl files using STIG Manager's convenient interface to build a Collection of Assets, and get a handle on their current Evaluation Status. 


  Manual STIGs, and STIGs with incomplete automation can be completed right in STIG Manager's UI, either individually or as a group. Convenient references, such as Evaluations for other Assets in the Collection and a history of Rule Evaluations are easily accessible. IF applicable, Reviews for other Assets can be dragged and dropped right into another Assets Evaluation. 

  Work as a team. Stig Manager can show Evaluations you or your team have provided for other Assets in your Collection. 



  STIG Manager tracks Reviews using the Rule Version and Rule Check Content, so that When STIGs are updated, all Reviews for Rules with unchanged content are carried forward to the new STIG. 


  Enhance STIG Manager with utilities and clients of your own. STIG Manager was built with a well-documented RESTful API to enable convenient integration with other tools. 


  * Single source of truth for Evaluations and STIG Status.


  Targeted Remediation Efforts
  Use provided tools to target specific high value Vulnerabilities across all Assets in your Collection. Stigman does not remediate vulnerabilities, it represents accumulated data from manual evaluations and automated scans. 


  Targeted Evaluation Efforts


  Track Evaluations at the Rule content level. When a STIG updates, if the Rule content does not change, that result persists to the new version. 



  * Automatically create a collection of Assets from your existing .ckl files.
  * Review all your assets at once with the Collection Review workspace.
  * Provide a workspace for viewing manual and automated STIG evaluations together.
  * Enforce a Review Requirements for your Collection.
  * Reports for Findings.
  * Status reports, showing STIG Evaluation completeness
  * Generate POAM-style spreadsheets from your findings.
  * Single source of truth for Evaluations and STIG Status.

  Workspaces
  ----------------

  Collection Builder
  ----------------------

  Reporting
  -----------------




########################


.. toctree::
   :maxdepth: 1
   :caption: Common Tasks:

   common-tasks




---------------------

|


