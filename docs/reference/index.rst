.. _terminology:

Terminology and Concepts
===================================


This is a glossary with definitions for terms like :term:`Asset`:


.. glossary::

    Access Control List
        A list of Access Control Rules applied to a grant to determine what the grantee can access in a Collection.  Access Control Lists are managed in the Grants panel of the Manage Collection interface.  See :ref:`roles-and-access` for more information.

    ACL
        See :term:`Access Control List` 

    Access Control Rule
        An individual item describing varying levels of Access to the components of a Collection, such as specific Assets, STIGs, Labels, or the entire Collection. The overall Access Control List for a Grant is composed of these Access Control Rules. See :ref:`roles-and-access` for more information.

    ACL
        See :term:`Access Control List` 

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
            * :term:`Grants <Grant>` providing access to some or all of the Assets/STIGs in that Collection for a User or Group
            * :term:`Reviews <Review>`
            * Settings that control the behavior of the Collection, such as whether to require a Detail or Comment for each Review, Review History records, etc.
            * :term:`Labels <Label>` that can be applied to Assets in the Collection.
        
        **Collections can be structured as an RMF Package, but do not need to be.** It is recommended that large packages be broken up into more easily-manageable Collections, to which Users can be granted higher access and, therefore, greater autonomy. 

    Evaluation
        The Result or compliance state, either by a user or automated process, of a Review for a particular STIG Requirement on an Asset. 

    Finding
        A :term:`Review` with a Result of Open.
    
    Grant
        A Grant is a record of a User or User Group being given a Role in a Collection.  A User can have Grants in multiple Collections, and have different Roles in each Collection. Collection Owners or Managers can create/remove/modify Grants. :term:`Access Control List` rules can be applied to Grants to further refine the User's access to the Collection.  See :ref:`roles-and-access` for more information.

    Label
        A Label is a user-defined tag that can be applied to Assets in a Collection. Labels can be used to filter Assets in the Collection Dashboard and other views, and can be used in Access Control Rules to restrict or enable access to Assets based on their Labels.

    Review
        A Review is the result of an Evaluation of a STIG Requirement that a User or automated tool has performed. These Reviews are composed of Review Evaluation Content and Status properties.  Each of these pieces carry an "Attribution" that includes the User that set that Content or Status and a timestamp indicating when they did so.  
		
        * Review Evaluation Content - Requirements configured via Collection Settings.
            * Result - Not a Finding, Not Applicable, Open, Informational, or Not Reviewed
            * Detail - Details describing the selected Result. Available according to Collection Settings.
            * Comment - Additional information included in the Review. Available according to Collection Settings. 
            * Result Sprites - Colored flags indicating whether the result originated from an automated scan or manual source. Hover over these sprites for more info. 
			
        * Status - The current state of the Review in the system. Configured via Collection Settings.
            * Status Label - Saved, Submitted, Accepted, or Rejected (Depends on Collection Settings.)
            * Status Text - Contextual text describing status change. Most often used when a Review is "Rejected" and requires further work by the original Evaluator.
		
          * In order to be Submitted, the Evaluation must have a Result of "Not A Finding," "Not Applicable," or "Open," and must meet any additional requirements set for that Collection. Hover over the ``(?)`` symbol for submission requirements. 
          * In order to be Rejected, the Owner must specify a Return Comment, providing direction to the Evaluator.



    	Each Review maintains a History, which is available to the User in the Review Resources panel. Contextual data such as the User who evaluated the Requirement, the user who set the Status of a Review, and timestamps for those actions are also collected.


        The use of Review Status fields is **optional**, but many users find it handy to "Save" Reviews in progress, and then mark them "Submitted" when they consider it complete.  Collection Owners (or, optionally, Managers) then have the option to set an "Accepted" Status for Reviews they might submit as part of an RMF package, or "Reject" Reviews that are unsatisfactory in their current state, or that they want more clarification on.  This Status will be visible to the User that evaluated the Review, and they can re-Submit the review once they have made changes.   

        See our section on :ref:`Review Handling and Matching<review-handling>` for more information about how STIGMan tracks Reviews.

    Role
        A Role is a set of permissions that can be granted to a User or User Group in a Collection. Roles are used to determine what actions a User can perform in a Collection, and what default access they have to Assets and Reviews. 

        There are four Roles available in STIG Manager. Roles differ in the actions they can perform in a Collection, and their default Access to Assets and Reviews.  See :ref:`roles-and-access` for more information.

        .. list-table:: Role Capabilities and Access 
            :widths: 20 40 40 
            :header-rows: 1
            :class: tight-table

            * - Role
              - Collection Management Capabilities  
              - Default Access
            * - Owner
              - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants. Can delete the Collection.
              - Full access to all Assets/Reviews (Can be restricted with Access Controls)
            * - Manage
              - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants with the exception of "Owner" grants. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators.
              - Full access to all Assets/Reviews (Can be restricted with Access Controls)
            * - Full
              - None
              - Full access to all Assets/Reviews (Can be restricted with Access Controls)
            * - Restricted
              - None
              - None (requires Access Controls)

    STIG
        Secure Technical Implementation Guidelines published by the Defense Information Security Agency. STIGs are published in XCCDF format that can be imported into STIG Manager. Automated results in XCCDF format, such as those produced by the DISA SCC Tool, can also be imported. Manually evaluated STIG Results are often recorded in a .ckl file, a different format, which is produced by the DISA tool STIG Viewer, and can also be imported into STIG Manager. 
		
    User
        Any User in STIG Manager can be assigned a grant that provides access to a Collection by the Collection Owner or Manager.

        * When you grant Users access to your Collection, or when you are granted access to another Collection by someone else, that Collection will appear in the Nav Tree on the left upon refresh of the app. 

        For each Collection they are granted access to, Users can have one of 4 :term:`Roles <Role>` , providing different capabilities and default access to your Collection.  See :ref:`roles-and-access` for more information. 

        Users can also be given one of 2 **Privileges** on the STIG Manager system. These privileges can be administered in your Authentication Provider (such as Keycloak):
            * Collection Creator: Gives the User the ability to create their own Collections in STIG Manager.  
            * Administrator (Application Manager): Gives the user elevated access to STIG Manager via the "Application Management" node of the Nav Tree. The Administrator Privilege allows the User to:
            
                * Import new STIGs into STIG Manager, as well as Delete them.
                * Create and Alter Collections, and view their metadata.
                * Create and Alter Users, and view their metadata.
                * Import and Export Application Data. An experimental feature that will export all the Collection data in STIG Manager
                * The Administrator privilege does not by itself provide access to any Collection, however, they can Grant themselves access to any Collection in STIG Manager via the Application Manager interface.

    User Group
        A named collection of Users that can be granted access to a Collection as a single entity. User Groups can be created and modified in the User Groups interface available to Application Managers. User Groups are  available to all Collection Owners and Managers for use in the Grants panel.  See :ref:`roles-and-access` for more information.


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
            The STIG Manager API supports all XCCDF rule result enumerations: fail, pass, notapplicable, notchecked, informational, error, notselected, unknown, and fixed. However, only the first 5 can be selected in the manual evaluation portions of the GUI. Those 5 results are mapped to display as Open, Not a Finding, Not Applicable, Not Reviewed, and Informational respectively, as these terms are commonly used during the RMF Process.  









