
.. _features-doc:

Feature List
##################

.. meta::
  :description: These pages describes STIG Manager OSS features.

These pages describes STIG Manager OSS features

.. note::
   This section is still under development.




Features and Capabilities Overview
====================================

"A new way to think about STIG compliance"


Accelerate Stpes 3 and 4 of the RMF Process
===================================================

STIG Manager serves as a central reference for current STIG Assignments, Evaluations, and progress for all parties involved in Package creation. 


Rather than passing .ckl files around, which, by their nature, are instantly out of date, STIG Manager provides the authoritative source for current STIG Evaluations and Package progress. 


Evaluate, validate, and check status of an entire Package at once. Track exactly when an Evaluation was last performed, both from automated, imported results and manual entries. 


Import SCAP results or .ckl files using STIG Manager's convenient interface to build a Collection of Assets, and get a handle on their current Evaluation Status. 


Manual STIGs, and STIGs with incomplete automation can be completed right in STIG Manager's UI, either individually or as a group. Convenient references, such as Evaluations for other Assets in the Collection and a history of Rule Evaluations are easily accesible. IF applicable, Reviews for other Assets can be dragged and dropped right into another Assets Evaluation. 

Work as a team. Stig Manager can show Evaluations you or your team have provided for other Assets in your Collection. 



STIG Manager tracks Reviews at the Rule level, so that When STIGs are updated, all Rules with unchanged RuleIds are carried forward to the new STIG. 


Enhance STIG Manager with utilities and clients of your own. STIG Manager was built with a well-documented RESTful API to enable convenient integration with other tools. 


* Single source of truth for Evaluations and STIG Status.




Track Evaluations at the Rule level. When a STIG updates, if the RuleId does not change, that result persists to the new version. 



* Automatically create a collection of Assets from your existing .ckl files.
* Review all your assets at once with the Collection Review workspace.
* Provide a workspace for viewing manual and automated STIG evaluations together.
* Enforce a workflow for your Collection.
* Reports for Findings.
* Status reports, showing STIG Evaluation completeness
* Generate POAM from your findings.
* Single source of truth for Evaluations and STIG Status.

Workspaces
----------------

Collection Builder
----------------------

Workflow Tracking
----------------------

Reporting
-----------------


