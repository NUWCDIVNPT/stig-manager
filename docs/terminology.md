## Terminology and Concepts used in STIG Manager.


### Collection
STIG Manager's primary organizational structure is the Collection. A Collection can be created to mirror components of an RMF Package, requirements identified in a Security Assessment Plan, or an entirely different principle that may be more convenient, such as by an organization's Lab or by Asset OS.

Collections are composed of:
  * Assets
  * STIGs attached to those Assets
  * User Grants providing access to some or all of the Assets/STIGs in that Collection
  * Reviews of the Rules that compose each attached STIG
  * Reports providing Status and Findings information
  
STIG Manager can build and update Collections with your existing artifacts, such as the .ckls produced by STIG Viewer or the automated STIG assessments in XCCDF format produced by the SCC tool, as well as manually from the Collection Configuration tab.  Once a Collection is created in STIG Manager, Users can be granted access to the Reviews for each STIG on an Asset, or the whole Collection. Users can see automated tool evaluations, and Rules that still require evaluation. 

[Collection Video](assets/videos/sc-3.mp4 ':include height=400px controls')


### Asset
An Asset is any component to which a STIG may be attached. Assets are created and changed in the Collection Configuration screen. To conform to the Navy RMF Process, an Asset must have a Name, IP Address, MAC Address, and Fully Qualified Domain Name unless it is designated "Non-Computing." The Asset Properties screen allows you to set all these properties, as well as attach STIGs.

### STIG

Secure Technical Implentation Guidelines published by the Defense Information Security Agency. STIGs are published in XCCDF format that can be imported into STIG Manager. Automated SCAP results in XCCDF format, such as those produced by the DISA SCC Tool, can also be imported. Manually evaluated STIG Results are often recorded in a .ckl file, a different format, which is produced by the DISA tool STIG Viewer, and can also be imported into STIG Manager. 

### User
Any User in STIG Manager can be granted access to a Collection by the Collection Owner or Manager.
   * When you grant Users access to your Collection, or when you are granted access to another Collection by someone else, that Collection will appear in the Nav Tree on the left upon refresh of the app.
For each Collection they are granted access to, Users can have one of 4 Access Levels, providing differing levels of access to your Collection: 
  ##### User Access Levels
  | Access Level 	| Access                                                                                                                   	|
|--------------	|--------------------------------------------------------------------------------------------------------------------------	|
| Restricted   	| Can review specific STIGs on specific Assets only.                                                                       	|
| Full         	| Can review any Asset/STIG in the Collection.                                                                             	|
| Manage       	| Everything in the "Full" level.<br>Can Add/Remove Assets, STIGs, and Users.                                              	|
| Owner        	| Everything in the "Manage" level.<br>Can Delete the Collection. <br>Responsible for "Accepting" reviews from evaluators. 	|

* In order to be useful, Users with Restricted access to a Collection must be assigned specific STIGs on specific Assets using the "Restricted User access list..." button in the Grants panel toolbar.

Users can also be given one of 3 **Privileges** on the STIG Manager system:
  * Collection Creator: Gives the User the ability to create their own Collections in STIG Manager.  
  * Global Access: Gives the User Read access to all Collections in STIG Manager.
  * Administrator: Gives the user Administrative access to STIG Manager via the "Administration" node of the Nav Tree. The Administrator Privilege allows the User to:
    * Import new STIGs into STIG Manager, as well as Delete them.
    * Create and Alter Collections, and view their metadata.
    * Create and Alter Users, and view their metadata.
    * Import and Export Application Data. An experimental feature that will export all the Collection data in STIG Manager (except Review History)
    * The Administrator privilege does not by itself provide access to any Collection, however, they can Grant themselves access to any Collection in STIG Manager via the Administrative interface.


### Review
A Review is the result of an Evaluation of a STIG Rule that a User or automated tool has performed. A Review has several components:
  * Evaluation 
    * Result - Not a Finding, Not Applicable, Open
    * Result Comment - A comment describing the selected Result.
  * Recommendation - Available only if the Result is set to Open.
    * Action - Remediate, Mitigate, Exception
    * Action Comment - A comment describing the selected Action.
  * Status - The current state of the Review in the Workflow. A review can be Saved, Submitted, Accepted, or Returned, according to its place in it's Collections Workflow.
    * In order to be Submitted, the Evaluation must have a Result and a Result Comment. If the Result is set to Open, then the Recommendation Action and Action Comment are also required. If the Review was Returned, at least one field must be changed in order to Submit it again.
    * In order to be Returned, the Owner must specify a Return Comment, providing direction to the Evaluator.
Each Review also maintains a History, which is available to the User in the Review Resources panel.
Metadata such as the User who evaluated the Rule, and a timestamp is also collected.

### Workflow

STIG Manager supports the concept of Workflows, which apply to Collections and alter the available Statuses for the Reviews they contain.

Currently, only the RMF Package Workflow is implemented.  In the RMF Package Workflow, Reviews can pass through the following states: 
  * Saved - The Review is saved in its current state.
  * Submitted - The Review has been Submitted to its Collection Owner for Acceptance.
  * Accepted - A Collection Owner has Accepted the Review, locking from further changes.
  * Returned - A Collection Owner has Returned the Review to it's evaluator for further clarification or other changes. Once changes are made, the evaluator can once again Submit the review.

Each status is called out in the Status Collection Report to help gauge overall Collection progress.


