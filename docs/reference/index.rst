
.. _terminology:

Terminology and Concepts
===================================


This is a glossary with definition terms for thing like :term:`Asset`:


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
            * - Detail
              - Finding Detail 
              - <CHECKLIST><STIGS><iSTIG><VULN> **<FINDING_DETAILS>**
            * - Comment 
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

    Review
        A Review is the result of an Evaluation of a STIG Rule that a User or automated tool has performed. These Reviews are composed of Review Evaluation Content and Status properties.  Each of these pieces carry an "Attribution" that includes the User that set that Content or Status and a timestamp indicating when they did so.  
		
        * Review Evaluation Content - Requirements configured via Collection Settings.
            * Result - Not a Finding, Not Applicable, Open
            * Detail - Details describing the selected Result. Available according to Collection Settings.
            * Comment - Additional information included in the Review. Available according to Collection Settings. 
            * Autoresult - Indicates result originated from an automated SCAP scan or manual source
			
        * Status - The current state of the Review in the system. Configured via Collection Settings.
            * Status Label - Saved, Submitted, Accepted, or Rejected (Depends on Collection Settings.)
            * Status Text - Contextual text describing status change. Most often used when a Review is "Rejected" and requires further work by the original Evaluator.
		
          * In order to be Submitted, the Evaluation must meet the requirements set for that Collection. Hover over the ``(?)`` symbol for submission requirements. 
          * In order to be Rejected, the Owner must specify a Return Comment, providing direction to the Evaluator.

    	Each Review maintains a History, which is available to the User in the Review Resources panel. Contextual data such as the User who evaluated the Rule, the user who set the Status of a Review, and timestamps for those actions are also collected.

      The use of Review Status fields is **optional**, but many users find it handy to "Save" Reviews in progress, and then mark them "Submitted" when they consider it complete.  Collection Owners then have the option to set an "Accepted" Status for Reviews they might submit as part of an RMF package, or "Reject" Reviews that are unsatisfactory in their current state, or that they want more clarification on.  This Status will be visible to the User that evaluated the Review, and they can re-Submit the review once they have made changes.   

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
              - Everything in the "Full" level.  Can Add/Remove Assets, STIGs, and Users. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators.
            * - Owner
              - Everything in the "Manage" level.  Can Delete the Collection.  Responsible for "Accepting"  and "Rejecting" reviews from evaluators.


        * In order to be useful, Users with Restricted access to a Collection must be assigned specific STIGs on specific Assets using the "Restricted User access list..." button in the Grants panel toolbar.

        Users can also be given one of 2 **Privileges** on the STIG Manager system. These privileges can be administered in your Authentication Provider (such as Keycloak):
            * create_collection: Gives the User the ability to create their own Collections in STIG Manager.  
            * admin: Gives the user App Management access to STIG Manager via the "Application Management" node of the Nav Tree. The Administrator Privilege allows the User to:
            
                * Import new STIGs into STIG Manager, as well as Delete them.
                * Create and Alter Collections, and view their metadata.
                * Create and Alter Users, and view their metadata.
                * Import and Export Application Data. An experimental feature that will export all the Collection data in STIG Manager (except Review History)
                * The admin privilege does not by itself provide access to any Collection, however, they can Grant themselves access to any Collection in STIG Manager via the App Management interface.


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
            * - Detail
              - <TestResult><rule-result> **<message>**
            * - Comment 
              - <TestResult><rule-result> **<metadata action-comment>** 

        .. note::
            The STIG Manager API supports all XCCDF rule result enumerations: fail, pass, notapplicable, notchecked, unknown, error, notselected, informational, and fixed. However, only the first 3 can be selected in the manual evaluation portions of the GUI. Those 3 results are mapped to display as Open, Not a Finding, and Not Applicable, respectively, as these terms are commonly used during the RMF Process.  









