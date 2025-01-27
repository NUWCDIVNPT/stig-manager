# Role-Based Access Control (RBAC) Details

## 1. Grant
Grant = Collection + User/Group + Role  (formerly Access Level)
### User collision
    - select any User Grant over any Group Grant(s).
    - when User matched by multiple Groups, select Grant with highest priority Role. Apply role collision rule on ties.
### Role collision
    - merge ACL resources and on Asset/STIG access collision select lowest access.  

## 2. Role
Role = Review ACL + Capabilities + Priority

## 3. Review ACL
ACL = List of Rules

Rule = Resource (unique per list) + Access

### Resource (resolves to list of Asset/STIG)
    - collection (all Assets and their mapped STIGs)
    - asset (this Asset and its mapped STIGs)
    - stig (this STIG and its mapped Assets)
    - label (all Assets with this Label and their mapped STIGs)
### Access (defined from lowest to highest)
    - none (allowed for Restricted role only)
    - read
    - read/write 
### Asset/STIG collisions
    - the most specific resource is selected.
### Access collisions
    - lowest access is selected.

## 4. Capabilities
### Collection
    - modify
    - delete
### Grant
    - create owner
    - create non-owner
    - modify owner
    - modify non-owner
    - delete owner
    - delete non-owner
### Asset
    - create
    - modify
    - delete
### STIG
    - map
    - unmap
### Label
    - create
    - modify
    - delete
    - map
    - unmap

## 5. Built-in Roles
For the built-in Roles:
- Each Role has a default Review ACL rule which cannot be removed.
- For all Roles, the Review ACL can be extended.
- Capabilities cannot be modified or extended.

| Priority | Role       | Default ACL rule        | Capabilities: Collection | Capabilities: Grant                                                                                                  | Capabilities: Asset              | Capabilities: Label                                   | Capabilities: STIG  |
|----------|------------|-------------------------|------------------------|--------------------------------------------------------------------------------------------------------------------|--------------------------------|-----------------------------------------------------|-------------------|
| 4        | Owner      |  read/write  | modify<br />delete     | create owner,<br />modify owner,<br />delete owner,<br />create non-owner,<br />modify non-owner,<br />delete non-owner | create<br />modify<br />delete | create<br />modify<br />delete<br />map<br />unmap  | map<br />unmap    |
| 3        | Manage     |  read/write  | modify                 | create non-owner,<br />modify non-owner,<br />delete non-owner                                                       | create<br />modify<br />delete | create<br />modify<br />delete<br />map<br />unmap  | map<br />unmap    |
| 2        | Full       |  read/write  | none                   | none                                                                                                               | none                           | none                                                | none              |
| 1        | Restricted | none                    | none                   | none                                                                                                               | none                           | none                                                | none              |

