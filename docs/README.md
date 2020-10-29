# STIG Manager

## What is STIG Manager?
STIG Manager is an Open Source API and Web client for managing the assessment of Information Systems for compliance with [security checklists](https://public.cyber.mil/stigs/) published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists [distributed](https://public.cyber.mil/stigs/downloads/) as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG).

Our Project incorporates software developed since 2012 by the [U.S. Naval Undersea Warfare Center Division Newport (NUWCDIVNPT)](https://www.navsea.navy.mil/Home/Warfare-Centers/NUWC-Newport/). More information, and the software itself, is available on GitHub: [STIG Manager](https://github.com/NUWCDIVNPT/stig-manager/)


## STIG Manager supports STIG Assessments in Steps 3 and 4 of the RMF Process

Throughout the RMF process, STIG Manager serves as the single source of truth for users, evaluators, managers, RMF Package reviewers, ISSEs, NQVs, and automated tools about Assets, STIGs, and their current assessment status.  By allowing everyone involved in the process to refer to the same set of data and reports, the RMF process can be executed efficiently and it's progress monitored effectively.  STIG Managers API allows automated tools to submit scan results, as well as access data for direction on what STIGs they should scan.

STIG Manager provides data structures, assessment workspaces, and Reports for managing these Steps of the RMF process.  

[Introduction Video](assets/videos/STIG_Manager_Introduction.mp4 ':include height=400px controls')


### Collections, Assets, STIGs, and Reviews
STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * Reviews of the Rules that compose each attached STIG
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reports providing Status and Findings information
  
Migrating to STIG Manager is easy because it can use your existing artifacts to build and update Collections. Assets, STIGs, and Reviews can be populated with the .ckls produced by STIG Viewer or the automated STIG assessments in XCCDF format produced by the SCC tool, as well as manually from the Collection Configuration tab.  Once a Collection is created in STIG Manager, Users can be granted access to see the current results for each STIG on an Asset, or the whole Collection. Users can see automated tool evaluations, and Rules that still require evaluation.

STIG Manager does not maintain a repository of uploaded checklists. Instead, it maintains a current state of evaluations for an asset, and will create new .ckls for you on demand with the most current results.

[Collection Video](assets/videos/Collections.mp4 ':include height=400px controls')


### Workspaces
The STIG Manager Client provides efficient workspaces for creating Collections of Assets and their associated STIGs, and assigning specific Users to evaluate those STIGs. User tasking can be managed in real time by granting Collection roles with varying levels of access, down to individual STIGs on specific Assets. Users have access to efficient STIG Review workspaces that provide resources to guide their evaluations, such as their previous answers for other Assets or whether an automated check is available, as well as allow them to evaluate multiple Assets at once.  Every User gets real time reports and statistics about their progress and the status of their Reviews, scoped to their level of access in each Collection. 

[STIG Manager Workspaces Video](assets/videos/STIG_Manager_Workspace_Walkthrough.mp4 ':include height=400px controls')



### Workflow
STIG Manager supports an "RMF Package Workflow" that allows designated Collection Owners to "Return" Reviews to evaluators for further revision or clarification, such as when a Finding requires further Detailing. Collection Owners can also "Accept" a Review, locking it from further revision by evaluators while they prepare their POA&M. 

### Reporting
Reports adjust as new STIGs are assigned, results imported, or when new DISA STIG revesions are imported, to provide information on the status and progress of evaluations.

The Collection Configuration workspace provides real-time totals for level of work required as changes to Assets and STIGs are made.

### User Access Controls
STIG Manager provides granular Role-Based Access Controls that can give Users access to some or all of the Assets and their STIGs in a Collection.

### STIG Manager is CCI-aware
STIG Manager maintains relationships between STIG Rules and their associated CCIs and Assessment Procedures. Reports can be pivoted to show Assessments sorted by Rule, CCI, or Group.

STIG Manager can produce a pre-populated POA&M-like document that lists findings already decomposed into their related CCIs. 


### STIG Manager integrates with the RMF Lifecycle approach
STIG Manager is (almost) ready to support a life-cycle approach to RMF. With the implementation of the "Continuous" Workflow, STIG Manager will play a vital part of the RMF lifecycle.  When new STIGs are released, system or SAP changes occur, or new STIGs are applied, only the new content needs to be assessed.  STIG Manager also timestamps every review, to help determine compliance with the Continuous Evaluation approach. STIG Manager also maintains a history of every Review performed so Review changes over time can be referenced.


## Getting Started with STIG Manager

### Users
[A quick walkthrough to familiarize Users with STIG Manager and help them get started evaluating STIGs.](Quickstart_Guide.md)

### Admins
[A quick walkthrough aimed at Administrators of STIG Manager.](Admin_Guide.md)

### Operations
STIG Manager is available on GitHub and as a [Docker image](Docker.md).

### Terminology used in STIG Manager
An explanation of the [Terms and concepts](terminology.md) used in STIG Manager.

### Contribution Guide

To get involved witht he project, please read our [CONTRIBUTING](https://github.com/NUWCDIVNPT/stig-manager/blob/main/CONTRIBUTING.md) document.


## STIG Manager is an active, Open Source project

STIG Manager is actively under development. Get the latest info here: [STIG Manager](https://github.com/NUWCDIVNPT/stig-manager/)


STIG Manager is participating in the [Code.mil Open Source initiative](https://code.mil/).

The STIG Manager project is chiefly composed of the STIG Manager API and the STIG Manager Client. The STIG Manager API provides a well-defined programmatic interface for engaging with the resources and data it maintains. The STIG Manager Client is just one use of the API that this architecture enables. In a modern, open source microservice-oriented ecosystem, other developers will be able to contribute new utilities and services that will expand functionality. User Stories, Feature Requests, Bugs, and Issues will be tracked in GitHub to help determine future efforts. Several candidate utilities, such as automated imports of HBSS SCAP evaluations and a STIG Browser, are already listed in the STIG Manager Github repo.  The architecture enables clients to be scoped appropriately. For example, in the notional STIG Browser utility mentioned above, that utility could be assigned a scope that will only provide access to the STIG Checklists themselves, and not the actual Reviews, Assets, etc that are also maintained by the API.

### STIG Manager Operations

STIG Manager is a modern, containerized application built to take full advantage of a CI/CD DevOps pipeline. Updates to STIG Manager will trigger automatic testing and image creation. Organizations will have the option to engage with the pipeline to automatically deploy new versions to their test environments, or directly to production.

### Status

This repository is receiving several commits a week as we work [Phase 1 of the Project](roadmap.md). During Phase 1, the `main` branch will contain buildable, development-quaity code. Daily commits are being made to the `phase-1-dev` branch and some of these commits may include unbuildable code.

## Roadmap

All new contributions to the Project will be directed towards stable production releases of the software in accordance with our [Roadmap](roadmap.md).

