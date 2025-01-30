.. _roles-and-access:


Collection Grants, Roles, and Access Control
####################################################

STIG Manager implements a Role-Based Access Control (RBAC) system to manage access to Collections.  This system allows the Collection Owner or Manager to Grant Users a Role in their Collection, and optionally create an Access Control List (ACL) for each Grant.


.. note:: 

  Collection Grants are specific to each Collection and its contents. They are distinct from :ref:`User Privileges<user-roles-privs>`, which allow Application-wide management functions and Collection creation. User Privileges are managed through the configured OIDC Provider. 


Grants
--------------------------------------------------------

A Grant is a record of a User or User Group being given a Role in a Collection.  A User or Group can be given Grants in multiple Collections, with different Roles in each Collection. Users with the Owner or Manage Role can create, modify, and remove Grants to the Collection.

Grants are composed of the following elements:

  - **Grantee:** The User or Group who is being granted a Role in the Collection.
  - **Role:** The Role that the Grantee is being given in the Collection.
  - **Access Control List:** Rules that define which Reviews the Grantee can see and Evaluate in the Collection.


Roles
--------------------------------------------------------

There are four Roles available in STIG Manager, defined below. The Roles differ based on:

    - **Collection Management Capabilities:** Actions the user can perform on the Collection itself.
    - **Default Access:** The base level of access allowed to Reviews. This access can be further refined by an ACL.

Each Role is also given a **Priority**, to handle scenarios where a User is a member of multiple Groups having Grants with different Roles.

The following Collection Roles are available:

.. list-table:: 
    :widths: 20 40 40 10
    :header-rows: 1
    :class: tight-table

    * - Role
      - Collection Management Capabilities  
      - Default Access
      - Priority
    * - Owner
      - Add/Remove/Modify Assets, STIG assignments, Labels, and Grants. Can delete the Collection. Can "Accept" and "Reject" reviews from evaluators.
      - Read/Write access to Reviews for all Assets/STIGs
      - 4
    * - Manage
      - Add/Remove/Modify Assets, STIG assignments, Labels, and Grants with the exception of "Owner" grants. Optionally can "Accept" and "Reject" reviews from evaluators.
      - Read/Write access to Reviews for all Assets/STIGs
      - 3
    * - Full
      - None
      - Read/Write access to Reviews for all Assets/STIGs
      - 2
    * - Restricted
      - None
      - None (Access derived solely from the ACL)
      - 1


.. _EffectiveGrant:

Effective Grant
--------------------------------------------------------

When a User interacts with a Collection, STIG Manager selects the User's Effective Grant from the User and Group Grants that include the User. These rules are followed when selecting the Effective Grant:

**1. Direct Grants to Users take precedence over Group Grants**

  If User1 is a member of Group1, and both User1 and Group1 have Grants in the Collection, only the Grant given directly to User1 will apply. The Grant given to Group1 will be ignored for User1.

**2. When a User belongs to multiple Groups given Grants, the Group Grant with the highest Role Priority is selected**

  If User1 is a member of Group1 and Group2, and Group1 has a "Manage" Role and Group2 has a "Full" Role in the Collection, User1 will have the "Manage" Role in the Collection.

**3. When a User belongs to multiple Groups given Grants with an identical highest Role Priority, the Effective Grant is for that Role and the Grant ACLs will be merged**

  If User1 is a member of Group1 and Group2, and Group1 and Group2 both have a "Full" Role in the Collection, User1 will have the "Full" Role in the Collection and their :ref:`Effective ACL<EffectiveACL>` will merge rules from both Group Grants.

Access Control List (ACL)
--------------------------------------------------------

A Grant's ACL includes one or more Access Rules, which allow fine-grained management of which Reviews users can view and modify in a Collection. They are particularly important for users with the Restricted role, as these users have no default access.

.. note::
  For Grants having the Owner, Manage or Full Role, an ACL is optional and used only to disallow Write Access to Resources. By default, these Roles have Read/Write access to all Reviews in the Collection.


Access Rules
--------------------------------------------------------

Rules are composed of a **Resource** and an **Access** level.

A **Resource** is defined from the following elements:

  - **Collection**: All Assets in the Collection and their assigned STIGs.
  - **Asset**: An Asset and its assigned STIGs. Can be combined with a STIG element.
  - **STIG**: A STIG and its assigned Assets. Can be combined with an Asset or a Label element.
  - **Label**: All Assets tagged with the Label and their assigned STIGs. Can be combined with a STIG element.

The **Access** level is set as one of three values:

  - **Read**: Can view reviews, but cannot create or modify them
  - **Read/Write**: Can view, create and modify reviews
  - **None**: No access (available only in ACLs for the Restricted role)


.. note::
  The order of Rules in an ACL is not significant.


Rules can be defined for individual Assets, STIGs, or Labels, or can be combined to create complex access rules. For example, a user could be allowed Read access to the "Database" label, and Read/Write access to the "PostgreSQL_9-x_STIG" STIG. This will have the effect of letting the user **view** reviews for all STIGs assigned to Assets tagged with the "Database" label, but also **create and modify** reviews for the PostgreSQL STIG on those Assets.


.. _EffectiveACL:

Effective ACL
--------------------------------------------------------

When determining a User's access to Resources in a Collection, STIG Manager calculates an Effective ACL from the ACL of the User's :ref:`Effective Grant<EffectiveGrant>`. In the Effective ACL, each rule is an Asset/STIG combination and an Access level.


.. note::
  In many cases, only one Grant's ACL needs to be considered. However, if a User belongs to multiple Groups, and those Groups have Grants with an identical highest Role Priority, the Effective ACL is calculated after merging the Rules from each Group's ACL.


The following rules are applied when calculating the Effective ACL:

**1. When an Asset/STIG matches multiple Rules, the Rule with the most specific Resource takes precedence.**

Specificity is calculated from the elements of the Resource, by summing each element where Asset = 1, STIG = 1, Label = 1, and Asset/STIG = 1. Therefore, a Collection resource has specificity of 0. Resources defined by only an Asset, STIG or Label have specificity of 1. A Label/STIG resource has specificity of 2, and an Asset/STIG resource has specificity of 3.

For example, Asset-123 has the label "Windows Workstation" and is assigned the Windows_10_STIG. A User is requesting access to the Windows_10_STIG on Asset-123. Their Effective Grant has an ACL with the following rules:

.. list-table::
    :widths: 40 10
    :header-rows: 1
    :class: tight-table

    * - Resource
      - Access  
    * - Asset "Asset-123" + STIG "Windows_10_STIG"
      - Read/Write
    * - Label "Windows Workstation" + STIG "Windows_10_STIG"
      - Read

In this case, even though Asset-123 has the label "Windows Workstation", the first rule takes precedence because it has higher specificity. STIG Manager will allow Read/Write access to the Windows_10_STIG on Asset-123, and Read only access to the Windows_10_STIG on other Assets with the "Windows Workstation" label.

**2. When Access levels conflict, the most restrictive Access level is applied.**

For example, Asset-123 has the label "Current Priorities" and is assigned the Windows_10_STIG. A User is requesting access to the Windows_10_STIG on Asset-123. Their Effective Grant has an ACL with the following rules:

.. list-table::
    :widths: 40 10
    :header-rows: 1
    :class: tight-table

    * - Resource
      - Access  
    * - Label "Current Priorities"
      - Read/Write
    * - STIG "Windows_10_STIG"
      - Read

In this case, since Asset-123 has Label "Current Priorities" and is also assigned Windows_10_STIG, both rules could apply since they have the same specificity. However, Read access is more restrictive so STIG Manager would allow only Read access to the Windows_10_STIG on Asset-123. 

To display the Effective ACL for a User, navigate to the Users tab in the Manage Collection interface. Hover over the row for a User and click the target icon to open the display.

Examples of ACL Management
--------------------------------------------------------

All examples below apply to Grants to both Users or User Groups. 
These actions can be performed by a Collection Owner or Manager in the Manage Collection interface.
To edit the ACL for a Grant, click the "Edit ACL" button displayed when hovering over the Grant.

.. thumbnail:: /assets/images/collection-manage-grants-w-edit-acl-highlighted-trimmed.png
      :width: 25% 
      :show_caption: True
      :title: Click the Edit ACL button to manage the ACL for a Grant.


**Grant Read/Write on an entire Collection**
  - Create a Grant for the User or Group with the Full Role
  - No specific ACL is required. Default access for the Full Role allows Read/Write access to Reviews for all Assets and STIGs in the Collection.
  
**Allow a User to change Reviews for all Assets and STIGs in a Collection, except for those with the "For Reference" label**
  - Grant the User a Full, Manage, or Owner Role
  - Click the "Edit ACL" button displayed when hovering over the Grant.
  - Select "For Reference" from the "Labels" node of the Collection Resources tree, and "Add -> with Read Only" access. Save.
  - By default, these roles have Read/Write access to all Assets and STIGs in the Collection. Adding this rule restricts access to Assets with the "For Reference" label to "Read Only".


**Make the entire Collection Read-only for a specific User or Group**
  - Grant the User any Role
  - Click the "Edit ACL" button displayed when hovering over the Grant.
  - Select the "Collection" node in the Collection Resources Tree.
  - Click the "Add" button and select "with Read Only access." Save.
  

.. thumbnail:: /assets/images/collection-manage-acl-popup-collection-selected.png
      :width: 25% 
      :show_caption: True
      :title: Select the Collection, and "Add with Read Only access."
  

