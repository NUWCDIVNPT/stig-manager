
.. _terminology:

Terminology and Concepts
===================================


This is a glossary with definition terms for thing like :term:`Workflow`:


.. glossary::

    Asset
        An Asset is any component to which a STIG may be attached. Assets are created and changed in the Collection Configuration screen. To conform to the Navy RMF Process, an Asset must have a Name, IP Address, MAC Address, and Fully Qualified Domain Name unless it is designated "Non-Computing." The Asset Properties screen allows you to set all these properties, as well as attach STIGs.

    checklist
        The list of Rules that compose a STIG, and optionally, their Evaluations. Often encoded in the :term:`ckl` format. 

    ckl
        An xml file format used by some common STIG tools. STIG Manager can import and export checklists in the .ckl format compatible with STIG Viewer and eMASS. 
        
        STIG Manager maps its own data fields into and out of .ckl format as follows:

        .. list-table:: STIG Manager <-> STIG Viewer <-> .ckl Mappings: 
            :widths: 20 20 40
            :header-rows: 1
            :class: tight-table

            * - STIGMan Field
              - STIG Viewer Field
              - .ckl Tag
            * - Evaluation Result
              - Status
              - <CHECKLIST><STIGS><iSTIG><VULN> **<STATUS>**
            * - Evaluation Comment
              - Finding Detail 
              - <CHECKLIST><STIGS><iSTIG><VULN> **<FINDING_DETAILS>**
            * - Recommendation Action
              - Comments
              - <CHECKLIST><STIGS><iSTIG><VULN> **<COMMENTS>**  *(Will be prepended to .ckl Comment on export, as .ckls do not have a specific tag for this information. When imported, if the Comments start with an Action, that field will be set accordingly.)*
            * - Recommendation Comment 
              - Comments
              - <CHECKLIST><STIGS><iSTIG><VULN> **<COMMENTS>**

        .. note::
            STIG Manager will import and export .ckl files differently depending on the values of certain .ckl elements and Asset metadata. See :ref:`ckl-processing` for more information. 


    Collection 
        The Collection is STIG Manager's primary organizational component.

        Collections are composed of:

            * :term:`Assets <Asset>`
            * :term:`STIGs <STIG>` attached to those Assets
            * :term:`User Grants <User>` providing access to some or all of the Assets/STIGs in that Collection
            * :term:`Reviews <Review>`
        
        **Collections can be structured as an RMF Package, but do not need to be.** It is recommended that large packages be broken up into more easily-manageable Collections, to which Users can be granted higher access and, therefore, greater autonomy. 

    Evaluation
        The Result or compliance state, either by a user or automated process, of a Review for a particular RuleId on an Asset. 

    Finding
        See :term:`Review` 

    Package
        An RMF Process term referring to a group of artifacts describing a System that is submitted for ATO consideration. Within STIG Manager, a Package can be represented as a Collection or group of Collections. 

    Recommendation 
        Applicable to "Open" Findings, the additional steps that will be taken to address the Open Finding. Composed of an Action (Remediate, Mitigate, Exception) and an Action Comment.

    Review
        A Review is the result of an Evaluation of a STIG Rule that a User or automated tool has performed. A Review has several components:
		
        * Evaluation 
		
            * Result - Not a Finding, Not Applicable, Open
            * Result Comment - A comment describing the selected Result.
			
        * Recommendation - Available only if the Result is set to Open.
		
            * Action - Remediate, Mitigate, Exception
            * Action Comment - A comment describing the selected Action.
			
        * Status - The current state of the Review in the Workflow. A review can be Saved, Submitted, Accepted, or Returned, according to its place in its Collections Workflow.
		
            * In order to be Submitted, the Evaluation must have a Result and a Result Comment. If the Result is set to Open, then the Recommendation Action and Action Comment are also required. If the Review was Returned, at least one field must be changed in order to Submit it again.
            * In order to be Returned, the Owner must specify a Return Comment, providing direction to the Evaluator.

    	Each Review maintains a History, which is available to the User in the Review Resources panel. Metadata such as the User who evaluated the Rule, and a timestamp is also collected.

    STIG
        Secure Technical Implementation Guidelines published by the Defense Information Security Agency. STIGs are published in XCCDF format that can be imported into STIG Manager. Automated SCAP results in XCCDF format, such as those produced by the DISA SCC Tool, can also be imported. Manually evaluated STIG Results are often recorded in a .ckl file, a different format, which is produced by the DISA tool STIG Viewer, and can also be imported into STIG Manager. 
		
    User
        Any User in STIG Manager can be granted access to a Collection by the Collection Owner or Manager.

        * When you grant Users access to your Collection, or when you are granted access to another Collection by someone else, that Collection will appear in the Nav Tree on the left upon refresh of the app. 

        For each Collection they are granted access to, Users can have one of 4 Access Levels, providing differing levels of access to your Collection: 
		
        .. list-table:: The 4 Access Level grants provide differing levels of access to your Collection: 
            :widths: 20 70
            :header-rows: 1
            :class: tight-table

            * - Access Level
              - Description
            * - Restricted
              - Can review specific STIGs on specific Assets only.    
            * - Full
              - Can review any Asset/STIG in the Collection.
            * - Manage
              - Everything in the "Full" level.  Can Add/Remove Assets, STIGs, and Users.
            * - Owner
              - Everything in the "Manage" level.  Can Delete the Collection.  Responsible for "Accepting" reviews from evaluators.


        * In order to be useful, Users with Restricted access to a Collection must be assigned specific STIGs on specific Assets using the "Restricted User access list..." button in the Grants panel toolbar.

        Users can also be given one of 3 **Privileges** on the STIG Manager system. These privileges are administered in Keycloak through the assignment of User Roles:
            * Collection Creator: Gives the User the ability to create their own Collections in STIG Manager.  
            * Global Access: Gives the User Read access to all Collections in STIG Manager.
            * Administrator: Gives the user Administrative access to STIG Manager via the "Administration" node of the Nav Tree. The Administrator Privilege allows the User to:
            
                * Import new STIGs into STIG Manager, as well as Delete them.
                * Create and Alter Collections, and view their metadata.
                * Create and Alter Users, and view their metadata.
                * Import and Export Application Data. An experimental feature that will export all the Collection data in STIG Manager (except Review History)
                * The Administrator privilege does not by itself provide access to any Collection, however, they can Grant themselves access to any Collection in STIG Manager via the Administrative interface.


    Workflow
        STIG Manager supports the concept of Workflows, which apply to Collections and alter the available Statuses for the Reviews they contain.

        Currently, only the RMF Package Workflow is implemented. The goal of this workflow is to move evaluations towards an Accepted status that can become part of a POAM. This workflow supports the following statuses:
		
        - **Saved** - The initial state for a review. An evaluation or other data is stored, but has not been "submitted" to the Collection Owner for Acceptance. 
        - **Submitted** - The Evaluator has marked this review as "Submitted," meaning it has been flagged for attention by Collection Owners to either Accept or Reject. The Submitted status has certain requirements:

            - All Evaluations must have both a Result and a Result Comment
            - All "Open" Evaluations must also have an Action and an Action Comment

        - **Accepted** - A Collection Owner has accepted this review as complete and meeting their process requirements. Further modification of the Review will cause it to lose it's "Accepted" status.  
        - **Rejected** - A Collection Owner has rejected this review for further work or clarification by the Reviewer. The Reviewer will have to make changes, then set back to "Submitted" to continue the workflow.

            - In order to be Rejected, the Collection Owner must provide a Rejection Comment.

		Each status is called out in the Status Collection Report to help gauge overall Collection progress.

    XCCDF
        An XML formatted schema for encoding STIGs and their Evaluations. 

        STIG Manager maps its own data fields into and out of XCCDF format as follows:

        .. list-table:: STIG Manager <-> XCCDF Mappings: 
            :widths: 20 70
            :header-rows: 1
            :class: tight-table

            * - STIGMan Field
              - XCCDF Tag
            * - Evaluation Result
              - <TestResult><rule-result> **<result>**    
            * - Evaluation Comment
              - <TestResult><rule-result> **<message>**
            * - Recommendation Action
              - <TestResult><rule-result> **<metadata action>** 
            * - Recommendation Comment 
              - <TestResult><rule-result> **<metadata action-comment>** 








