# User changes

## Properties
- Removed `deptId` property
- Removed `accessLevel` property
- Added `globalAccess` boolean property
    - If `true`, User can access and manage all Packages on system
    - Usually `false`, Package access and management is explicitly granted
- Retained `canAdmin` to allow elevation for administrative functions (e.g., creating Packages and Users)

## Package Grants
- User can be granted access to one or more Packages
- Each User/Package grant has a required `accessLevel` property

- | `accessLevel` | Asset/STIG access | Package management |
    |:---:|:---:|:---:|
    |1|Assigned only|No|
    |2|All|No|
    |3|All|Yes|

