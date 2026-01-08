# STIG Manager Client - Components

Outlines common component types used in the current client, and how they might map into the new client.


## Columns for Data Tables:

### Columns:
- **AssetColumn**: Displays asset names.
- **CountColumn**: Displays a simple count value. (ie. Asset count)
- **DurationColumn**: Displays duration values in a human-readable format.
- **PercentageColumn**: Displays percentage values.

### complex columns (in cd experimental branch):
- **AssetWithLabelsColumn**: Displays asset names along with their associated label on a sub-row.If truncated, adds a "+N" badge with a tooltip showing truncated labels.
- **CountColumnWithTooltip**: Displays a count with a tooltip listing counted items. (ie. STIG IDs, Collections IDs, User Grants, group users, findings: assets)
- **LabelsColumnWithTooltip**: Displays a list of labels associated with an item. (ie. Asset labels, ) If truncated, adds a "+N" badge with a tooltip showing all labels.


### Possible additional column types:
- **ListColumnInline**: Displays a list of items in a cell. (stig management:"earl  ier revisions")
- **ListColumnNewline**: Displays a list of items in a cell. (ie. CCIs; service jobs: "tasks",schedule, last run, findings: stigs)
- **SingleLabelColumn**: Displays a single label in a cell. Could just be label Column. (label management, metrics labels tab)
- **iconColumn**: Displays an icon (with optional tooltip). (ie. asset type icon in asset table)
- **DataWithBadgeColumn**: Displays benchmark name with badge showing classification, type (stig management:"benchmarks", effective grants (icon, not badge...))
- **BadgeColumn**: Displays N items in badges. (stig diff:"changed properties", stig status,)
- **ActionColumn**: Displays action buttons. (ie. history, attachments, edit, delete)

### "Status" Columns:
- **ResponseCodeColumn**: Displays status with color coding. (service jobs: ie. 500 = red, 200 = green)
- **resultColumn**: Displays results
- **ResultOriginColumn**: Displays result origin icon (user/engine) with color coding, popover. (stig scan results: ie. manual = blue, automated = green)
- **ReviewStatusColumn**: Displays review status icon


### multi-line Columns:
#### specific:
- **AssetWithLabelsColumn**: Displays asset names along with their associated label on a sub-row. If truncated, adds a "+N" badge with a tooltip showing truncated labels.
#### generic?:
- **RowAndSubRow**: pattern for displaying additional information related to the main cell content.
  ie.:
  - **labelAndStig** - ACL rule table 
  - **AssetAndStig** - ACL rule table 
  - **usernameAndDisplayname** - grant management (username and display name)
  - **UserWithEmailColumn**: Displays user names along with their email on a sub-row. (grantee)


### Column Header: 
- with info icon and tooltip (collection review)
- sorting
- filtering
- checkbox selection

### column with reactive Cells:
-  cell background (collection review stats (ie. O-red, NF-green, stats-neutral))




## Rows:
- checkbox row
- in-line editable row

### Expandable:
- **ExpandableReviewRow**:  Review columns plus review detail/Comment/statusUser/statusText in expanded content (review history, findings: individual findings, could also be used for "other assets?")

## Table Footer:
- refresh
- csv export
- totals badges (saved/submitted/approved/O/NA/NF) with tooltips
- totals badges w/icon and tooltips
- displayed/total row count

### Badges/icons content:
- Severity Category - stig library, stig diff,
- Severity Count - metrics,
- CORA Risk Rating - metrics,
- Classification - benchmark display, stig management (badges on benchmark names)
- result badges
- status icons
- review origin icons


## Assignment Interfaces:

user group membership:
- table left (users/groups), table right (groups/users)

direct grants, stig assignments:
- table left (collection), table right (collection)
- table left (assets/stigs), table right (stigs/assets)

ACL rules:
- tree on left, table on right


## Panels:

### Rule/Check content panel
- **RuleCheckPanel**: Manual Check/Fix panel
- **RuleOtherInfoPanel**: Discussion, documentable, controls
- **DetailedChanges**: Diffs panel in rule comparision view

### JSON Object Tree display:
- **JsonObjectPanel**: Displays a JSON object in a formatted panel with syntax highlighting. (last claims, API responses, app info json)

### Panels with header actions:
- **Progress**: import ckl/scap
- **Inventory**: export/manage
- **findings**: details




