.. _roles-and-access:


Collection Grants, Roles, Access, and User Groups
####################################################

STIG Manager uses a Role-Based Access Control (RBAC) system to manage access to Collections.  This system allows the Collection Owner or Manager to Grant Users a Role in their Collection, and then assign Access Controls to those Grants.


.. note:: 

  The Collection Roles and Access are distinct from the overall Application Privileges, which are managed by the configured OIDC Identity Provider. Collection Grants, Roles, and Access are specific to each Collection and its contents.


Grants
--------------------------------------------------------

A Grant is a record of a User or User Group being given a Role in a Collection.  A User/Group can have Grants in multiple Collections, and have different Roles in each Collection. Collection Owners and Managers can create, modify, and remove Collection Grants for Users and Groups, controlling access to their Collection.

Grants are composed of the following elements:
  - Grantee: The User or Group who is being granted a Role in the Collection.
  - Role: The Role that the Grantee is being given in the Collection.
  - Access Controls: The Access Controls that define what Assets and STIGs the Grantee can see and Evaluate in the Collection.


Roles
--------------------------------------------------------

There are four Roles available in STIG Manager, defined below. Roles differ in the actions they can perform in a Collection, and their default Access to Assets and Reviews. 

Each Role in STIG Manager combines two distinct aspects:
- Collection Management Capabilities: Actions the user can perform on the Collection itself.
- Default Access: The base level of access granted to Assets and their Reviews. This access can be further refined with Access Controls.

The following Collection Roles are available:

.. list-table:: Role Capabilities and Access 
    :widths: 20 40 40 
    :header-rows: 1
    :class: tight-table

    * - Role
      - Collection Management Capabilities  
      - Default Access
    * - Owner
      - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants. Can delete the Collection.
      - Read/Write access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Manage
      - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants with the exception of "Owner" grants. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators.
      - Read/Write access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Full
      - None
      - Read/Write access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Restricted
      - None
      - None (Access to Assets derived solely from Access Controls configured by Owner or Manager)


Access Control Rules
--------------------------------------------------------

Access Controls Rules allow fine-grained management of what Assets and STIGs users can see and Evaluate in a Collection. They are particularly important for users with the Restricted role, as these users have no default access and rely entirely on Access Controls to perform their work.

Access Controls can be defined based on any combination of the following elements:
  - **Collection**: Add a rule that applies to all Assets and STIGs in the Collection.
  - **Assets**: Specific Assets in the Collection
  - **STIGs**: Security Technical Implementation Guides assigned to Assets
  - **Labels**: Tags that group Assets together

The level of Access to the resources defined by the above elements can be set to one of three levels:
  - **Read**: Can view reviews and results
  - **Read/Write**: Can create and modify reviews
  - **None**: No access (Restricted role only)

Access Controls can be applied to individual Assets, STIGs, or Labels, and can be combined to create complex access rules. For example, a user could be granted Read access to all Assets with the "Database" label, and Read/Write access to the "PostgreSQL_9-x_STIG" STIG. This will have the effect of letting the user **view** all reviews for all STIGs assigned to "Database" Assets, but only **create and modify** reviews for the PostgreSQL STIG on those Assets.


Access Control Priority
--------------------------------------------------------

When multiple Access Controls apply to the same Asset or STIG, the following rules determine the final access level:

**1. The most specific resource takes precedence. For example, a Restricted User grant that has the following ACL applied:**
  - An ACL Rule granting Read/Write access to "Asset-123 + Windows-10-STIG" is more specific than
  - An ACL Rule granting Read access to assets with the Label 'Windows Workstation'
  - In this case, if Asset-123 has the label "Windows Workstation", the first rule would take precedence where they overlap, and the User would have Read/Write access to the Windows-10-STIG on Asset-123, and Read only access on other STIGs on that Asset, and all STIGs on all Assets with the "Windows Workstation" label.

**2. When access levels conflict, the most restrictive access level is applied. For example, a Restricted User grant that has the following ACL applied:**
  - An ACL Rule granting Read/Write access to "Asset-123 + Windows-10-STIG" has the same specificity as
  - An ACL Rule granting Read access to "Label 'Windows Workstation' + Windows-10-STIG"
  - In this case, if Asset-123 has the label "Windows Workstation", both rules are composed of two elements, and apply to the same STIG on Asset-123. The Read access rule is more restrictive, so the User would have Read access to the Windows-10-STIG on Asset-123, AND Read access for the Windows-10-STIG on all other Assets with the 'Windows Workstation' label. 

**3. Direct Grants to Users take precedence over any Grant to a Group the User belongs to**
  - If User1 is a member of Group1, and both User1 and Group1 have Grants in the Collection, only the Grant given directly to User1 will apply. The Grant given to Group1 will be ignored for User1.

**4. When a user belongs to multiple Groups, the Grant with the highest priority Role is selected**
  - If User1 is a member of Group1 and Group2, and Group1 has a "Manage" Role and Group2 has a "Full" Role in the Collection, User1 will have the "Manage" Role in the Collection.

These controls allow Collection Owners and Managers to precisely define who can access what within their Collection.
The Users tab in the Manage Collection interface provides a granular view of the effective access for each User in the Collection, based on their Grants and Access Controls.



Role-Based Access Control (RBAC) Details
------------------------------------------------

For a granular breakdown of the RBAC model in STIG Manager, see the following description:
:doc:`Role-Based Access Control Details <rbac>`



Examples
--------------------------------------------------------

All examples below can apply to individual User Grants or Group Grants. 
These actions can be performed by the Collection Owner or Manager in the Manage Collection interface.
To edit the Access Control list for Grant, click the "Edit ACL" button next to the User or Group.

.. thumbnail:: /assets/images/collection-manage-grants-w-edit-acl-highlighted-trimmed.png
      :width: 25% 
      :show_caption: True
      :title: Click the Edit ACL button to manage Access Controls for a Grant.


**Grant a User or Group Read/Write on an entire Collection**
  - Create a Grant for the User or Group with the Full Role
  - No specific ACL required. Default access for the Full Role grants Read/Write access to Reviews for all Assets and STIGs in the Collection.
  
**Let a User change Reviews for all Assets and STIGs in a Collection, except for those with the "For Reference" label**
  - Grant the User a Full, Manage, or Owner Role
  - Select "For Reference" from the "Labels" node of the navigation tree, and "Add -> with Read Only" access. Save.
  - By default, these roles have Read/Write access to all Assets and STIGs in the Collection. Adding this rule restricts access only to Assets with the "For Reference" label to "Read Only".


**Make the entire Collection Read-only for a specific User or Group**
  - Select the "Collection" item in the Navigation Tree.
  - Click the "Add" button and select "with Read Only access." Save.
  

.. thumbnail:: /assets/images/collection-manage-acl-popup-collection-selected.png
      :width: 25% 
      :show_caption: True
      :title: Select the Collection, and "Add with Read Only access."
  

