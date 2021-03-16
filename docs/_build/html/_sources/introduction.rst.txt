
.. _Introduction:

Introduction
################

What is STIG Manager?
======================

STIG Manager is an Open Source API and Web client for managing the assessment of Information Systems for compliance with `security checklists <https://public.cyber.mil/stigs/>`_ published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists `distributed <https://public.cyber.mil/stigs/downloads/>`_ as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG) in the XCCDF format.

Our Project incorporates software developed since 2012 by the `U.S. Naval Undersea Warfare Center Division Newport (NUWCDIVNPT) <https://www.navsea.navy.mil/Home/Warfare-Centers/NUWC-Newport/>`_. More information, and the software itself, is available on GitHub: `STIG Manager <https://github.com/NUWCDIVNPT/stig-manager/>`_





RMF Process Support
=========================================

The Single Source of Truth throughout Steps 3 and 4 of the RMF Process
------------------------------------------------------------------------------------

Throughout the RMF process, STIG Manager serves as the single source of truth for users, evaluators, managers, RMF Package reviewers, ISSEs, NQVs, and automated tools about Assets, STIGs, and their current assessment status.  By allowing everyone involved in the process to refer to the same set of data and reports, the RMF process can be executed efficiently and it's progress monitored effectively.  STIG Managers API allows automated tools to submit scan results, as well as access data for direction on what STIGs they should scan.

STIG Manager provides data structures, assessment workspaces, and Reports for managing these Steps of the RMF process.  


.. raw:: html

  <video width="480"  controls>
    <source src="./_static/videos/STIG_Manager_Introduction.mp4" type="video/mp4">
  Your browser does not support the video tag.
  </video>

--------------------

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
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  
Migrating to STIG Manager is easy because it can use your existing artifacts to build and update Collections. Assets, STIGs, and Reviews can be populated with the .ckls produced by STIG Viewer or the automated STIG assessments in XCCDF format produced by the SCC tool, as well as manually from the Collection Configuration tab.  Once a Collection is created in STIG Manager, Users can be granted access to see the current results for each STIG on an Asset, or the whole Collection. Users can see automated tool evaluations, and Rules that still require evaluation.

.. note::
  STIG Manager does not maintain a repository of uploaded checklists. Instead, it maintains a current state of evaluations for an asset, and will create new .ckls for you on demand with the most current results.

.. raw:: html

  <video width="480"  controls>
    <source src="./_static/videos/Collections.mp4" type="video/mp4">
  Your browser does not support the video tag.
  </video>

-------------------------

Workspaces for Common Tasks and Getting a Handle on Your Evaluation Data
-------------------------------------------------------------------------------------

The STIG Manager Client provides efficient workspaces for creating Collections of Assets and their associated STIGs, and assigning specific Users to evaluate those STIGs. User tasking can be managed in real time by granting Collection roles with varying levels of access, down to individual STIGs on specific Assets. Users have access to efficient STIG Review workspaces that provide resources to guide their evaluations, such as their previous answers for other Assets or whether an automated check is available, as well as allow them to evaluate multiple Assets at once.  Every User gets real time reports and statistics about their progress and the status of their Reviews, scoped to their level of access in each Collection. 


.. raw:: html

  <video width="480"  controls>
    <source src="./_static/videos/STIG_Manager_Workspace_Walkthrough.mp4" type="video/mp4">
  Your browser does not support the video tag.
  </video>

-------------------



Workflow to Track Status and Make Progress Towards a POA&M
------------------------------------------------------------------

STIG Manager supports an "RMF Package Workflow" that allows designated Collection Owners to "Reject" Reviews to evaluators for further revision or clarification, such as when a Finding requires further Detailing. Collection Owners can also "Accept" a Review, locking it from further revision by evaluators while they prepare their POA&M. 

Reporting on Findings and Evaluation Status
---------------------------------------------------

Reports adjust as new STIGs are assigned, results imported, or when new DISA STIG revesions are imported, to provide information on the status and progress of evaluations.

The Collection Configuration workspace provides real-time totals for level of work required as changes to Assets and STIGs are made.

User Access Controls to Limit Access to Your Data
-----------------------------------------------------------

STIG Manager provides granular Role-Based Access Controls that can give Users access to some or all of the Assets and their STIGs in a Collection.

STIG Manager is CCI-aware
-----------------------------------

STIG Manager maintains relationships between STIG Rules and their associated CCIs and Assessment Procedures. Reports can be pivoted to show Open Findings sorted by Rule, CCI, or Group.

STIG Manager can produce a pre-populated POA&M-like document that lists findings already decomposed into their related CCIs. 


STIG Manager integrates with the RMF Lifecycle approach
--------------------------------------------------------------

STIG Manager is (almost) ready to support a life-cycle approach to RMF. With the implementation of the "Continuous" Workflow, STIG Manager will play a vital part of the RMF lifecycle.  When new STIGs are released, system or SAP changes occur, or new STIGs are applied, only the new content needs to be assessed.  STIG Manager also timestamps every review, to help determine compliance with the Continuous Evaluation approach. STIG Manager also maintains a history of every Review performed so Review changes over time can be referenced.




Getting Started with STIG Manager
======================================
:ref:`user-guide-index`

:ref:`admin-guide-index`



Reporting Bugs & Issues
-----------------------

Please file bug reports on the `STIG Manager 
issue tracker <https://github.com/NUWCDIVNPT/stig-manager/issues>`__. When reporting
a bug, please include as much information as possible. This includes:

-  Install type: Hosted, Local, Docker, etc
-  Action taken
-  Expected result
-  Actual result
-  Screenshot (if relevant)

License / Credits
-----------------

The  repository is licensed under the `MIT License <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__, with the exception of the client, which is licensed under the `GNU GPL
v3 <https://github.com/NUWCDIVNPT/stig-manager/blob/main/LICENSE.md>`__.






