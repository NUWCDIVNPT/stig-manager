1.4.12
-----

Changes:

  - (API) feat: “Anonymized Deployment Details” report enhancements
  - (UI/API) feat: Date/time added to filenames for exported/generated files
  - (API) fix: Asset updates without collectionId property preserves labels
  - (API) fix: default_rev and stats updated when current STIG revision is removed
  - (API) fix: Resolved issue preventing new deployments from using alternative DB user
  - (build) fix: resolved issue building images with uglify.js
  - (UI/API) feat: Default review history records setting for new Collections set to 5
  - (UI/API) feat: Max review history records setting limited to 15
  - (build) chore: dependency updates
  - **Includes database migration to update settings for existing Collections to reflect the new Review History cap where appropriate. No history is altered as part of the migration, history entries will be trimmed to new max as Reviews are subsequently updated.**


1.4.11
-----

Changes:

  - (UI/API) Removing feature from Release 1.4.8 adding resultEngine, user, statusUser columns to Detail metrics exports. The feature was found to cause poor performance in large deployments. 

1.4.10
-----

Changes:

  - (API) bugfix: Resolves issue allowing Collection Owner/Managers to create restricted grant assignments outside of Collection boundary
  
1.4.9
-----

Changes:

  - (UI) bugfix: Resolves issue preventing node expansion in the Export Results interface


1.4.8
-----

Changes:

  - (API) feat: Added resultEngine, user, statusUser columns to Detail metrics exports.
  - (API) feat: Listen on STIGMAN_API_PORT on startup and respond with status while bootstrap process is running.
  - (API) chore: Remove Dockerfile healthcheck
  - (API) chore: Refactor controllers to use a set of common functions when checking a collection grant or invoking elevation
  - (Docs) chore: Minor updates and clarifications

1.4.7
-----

Changes:

  - (API) dependency: Update mysql2 library in response to CVE-2024-21511
  - (UI) bugfix: STIG Management UI now displays system-wide count of Collections using a STIG.

1.4.6
-----

Changes:

  - (API) dependency: Update mysql2 library in response to CVE-2024-21508, CVE-2024-21509, CVE-2024-21507
  - (API) Refactor API definition for better maintainability
  - (API) Refactor db query construction for consistency

1.4.5
-----

Changes:

  - (UI/API) feat: Status text field expanded to 511 characters.
  - (UI) bugfix: Review `resultEngine` no longer keeps old value when using drag & drop from Other Assets. 
  - (API/DB) chore: Remove unused current_group_rule table and view. 
  - (API) bugfix: Review `resultEngine` now only set to null when PATCH'd with a `result` and no `resultEngine`.
  - (API) feat: DB bootstrap improvements, build script, static data.
  - (API) chore: Update dependency in response to CVE-2022-25881
  - **Includes database migration**

1.4.4
-----

Changes:

  - (UI/API) Review Ages exposed in more interfaces: Asset Review, Collection Review, Other Assets
  - (UI/API) Review min/max ages in Collection Review checklist presentations
  - (UI) Bulk .ckl[b]/xccdf imports from Collection Dashboard for all users (for Review updates only)
  - (UI) Reject Status Text validation
  - (UI) bugfix: Collection metadata deletes
  - (API) bugfix: Timestamp update misbehavior in some circumstances
  - (API) Dependency updates in response to CVE-2024-28849; CVE-2024-28176
  - (Docs) Guidance for updating deployments
  - (Docs) Database schemas and diagram updates  

1.4.3
-----

Changes:

  - (API/UI) Added multi-asset patch endpoint with delete support for better performance when deleting large numbers of Assets
  - (UI) Switch to newly-published stig-manager-client-modules package on npm
  - (Docs) Updates to documentation publish process
  - (API) Code cleanup
  - (Docs) Updated STIGMan ASD reference checklist version

1.4.2
-----

Changes:

  - (API/UI) Meta-Collection Dashboard feature
  - (Docs) Documentation updates
  - (Demo/Docs) Demo data updates, include STIGs for demo data.
  - (API) Code cleanup
  - (API/Dependency) Dependency updates  

  
1.4.1
-----

Changes:

  - (API) Fix regression preventing TLS connection to MySQL database


  1.4.0
-----

Changes:

  - (API/UI) Prevent invalid label assignments that could occur in some circumstances
  - (API) Fix for incorrect import statistics when importing multi-STIG ckl files
  - (API) Remove STIGMAN_DB_TYPE configuration option
  - (API) Refactor service folder structure and references
  - (Docs) Refactor documentation build process
  - (Workflows) Remove Iron Bank images from matrix testing workflow
  - (API) Change default behavior for STIGMAN_JWT_SERVICENAME_CLAIM processing to prefer standard OIDC claim
  - (API) Reject requests when valid username cannot be identified
  - (API/Dependency) Change default Iron Bank base image tag in response to vulnerability


1.3.14
-----

Changes:

  - (API/UI) Fixed issue that could create invalid filenames for export when Asset/Collection names used reserved characters
  - (UI) Fixed issue that caused borders of certain UI elements to disappear when zoomed
  - (API) Refactored post/put/patch asset review handling
  - (API) Fixed issue that could cause Review status to not reset in certain cases
  - (API/Dependency) Updated axios dependency in response to vulnerability

1.3.13
-----

Changes:

  - (UI/fix) Addressed bug in .cklb parsing preventing import.


1.3.12
-----

Changes:

  - (UI) Asset Label and STIG Assignment interface update
  - (UI) Resolved issue affecting updating reviews from Collection Review Workspace that were created with old RuleIds. 
  - (UI) Addressed issue affecting delimiter handling for inventory exports 
  - (API) Resolved issue that could be created when submitting Reviews for Rules with identical ids/fingerprints
  - (API) Statistics were not being recalculated when STIG Assignments were made using PUT endpoint
  - (Workflows) Refactored to incorporate SonarCloud analysis and matrix testing
  - (API) Remove automatic STIG download on first start
  - (Docs) Build dependency update
  - (API) Refactoring service references for clarity


1.3.11
-----

Changes:

  - (API/UI) Export Reviews to another Collection feature
  - (API) Transfer Asset Labels when moving Assets between Collections
  - (API/UI) Inventory Export feature


1.3.10
-----

Changes:

  - (API/UI) Provisional .cklb import/export feature.
  - (UI) Added CCIs column to STIG Library grid.
  - (API/fix) XML double-encoding regression after upgrading fast-xml-parser 
  - (API/fix) Handle missing description in xccdf benchmark
  - (UI/fix) Remove non-compliant elevate parameter, fix regression preventing app management interface from updating Collections
  - (UI/fix) Workaround non-standard what's new dates
  - (UI/fix) Duplicate collection name detection

1.3.9
-----

Changes:

  - (API/UI) Collection Cloning feature
  - (API/UI) Modify Delete handling for Collections, Assets, and Users to mark records 'disabled' rather than removing them from the database.
  - (UI) Grid text selection moved to right-click function
  - (API/UI) Added STIG Title to metrics endpoint responses, added STIG Title column (hidden by default) to Collection Metrics grids/exports.

1.3.8
-----

Changes:

  - (API/UI) Revision Pinning feature
  - (API/UI) Modify User Delete function to retain users that have accessed the system.
  - (API) OAS cleanup
  - (UI) More explanatory message when User attempts to create Collections or Assets with names that already exist.
  - (API) Dependency updates


1.3.7
-----

Changes:

  - (API) Update fast-xml-parser dependency to address CVE-2023-34104 (#1012)
  - (API) Addd stack trace to API error responses (#1011)  


1.3.6
-----

Changes:

  - (APP) tally sprites have been added to the bottom toolbars of grids that display Review data. These sprites show the relevant counts for the various rows, results, and statuses displayed in the grids above. (#992)
  - (App) Resolved Application Deployment Stats download issue. (#994)
  - (App) Resolved issue causing error when persistent Collection Review tab was re-opened.(#997)
  - (App) Resolved issue with errorEvents causing errors in error handler. (#998)
  - (Docs) Additional info about Review handling and tracking between STIG revisions. (#999)

1.3.5
-----

Changes:

  - (API) Review carry-forward feature implemented. Reviews are now associated with a key composed of the calculated digest of Rule Check Content and the Rule Version ("STIG ID"), rather than specific RuleIds. This will allow a much greater proportion of Reviews to apply across changes between STIG Revisions (#957).
  - (App) Last modified RuleId context now displayed in Attributions Panel, with hover text indicating other applicable RuleIds.
  - (App) OIDC Library refactor (#775).
  - (API/App) Assessment counts by severity now included in "Detailed" Metrics exports (#898).


1.3.4
-----

Changes:

  - (API/Hotfix) Resolves an issue with missing rule-CCI associations that was causing Findings report miscounts and incomplete Rule Info presentation. 
  - (API/Hotfix) Resolves issue that could exclude Findings for Rules that did not have an associated CCI.
  - (App/Hotfix) Removed asmCrypto dependency, replaced with native browser crypto functions.
  - (App) Added more informative error handling messages. 
  - (App) Resolved issue preventing Application Managers from creating/modifying Owner grants via the User Admin panel.
  - (API) Refactored Collection Checklist query to improve performance.
  - (Workflows) Updated GitHub workflows to generate test coverage reports, build and sign binary artifacts, audit npm dependencies.
  - (Workflows) The Iron Bank-based image offering on Docker Hub is now based on the Iron Bank Alpine Node image (nodejs18:18-slim), which scans much cleaner than the previously used RHEL UBI. [Reverted]


1.3.3
-----

Changes:

  - (API/Hotfix) Resolves issue that could lead to inaccurate metrics percentages after Releases 1.3.1 and 1.3.2.
  - (API/Hotfix) Resolves issue that could cause migration 0020 to fail when populating identical duplicate multi-check content fields.

1.3.2
-----

Changes:

  - (App) Pass clobber parameter when recursing zip file.
  - (API) Replace dependency `got` with `axios`.
  - (Docs) Project description, copyright, link updates; Disable failing pdf generation.
  - (App) Restores XSS protections inadvertently removed in 1.3.1.
  - (App) Display STIG Rule differences even if RuleId stayed the same; indicate RuleId change with badge as well as highlighting.
  - (App) Fix Swagger display issue in binary artifacts.

1.3.1
-----

Changes:


  - (App/API) Allow users to replace existing STIG Revisions when importing reference benchmarks.
  - (App) Restrict Collections Managers from creating or altering Owner Grants. (#934)
  - (App) Parse and import XCCDF with root-level TestResult element (Found in SCAP scan results performed by HBSS or ACAS).
  - (App/API) Support for importing known forms of non-DISA STIGs (vmWare STIG Readiness Guides).
  - (App) Made grid text selectable in most places.
  - (API) Added granular STIG Severity counts to metrics. (#915)
  - (API) Include controls associated with CCIs in CCI projection responses. 
  - (API) Updated dependencies identified as vulnerable by Dependabot. (#925) (#918)
  - (Docs) Various updates to documentation describing feature and behavior changes.
  - (API) Removed remaining references to unused "global" privilege. (#909)
  - (App/API/DB) Database and API changes to enable future features, including storing the hash of Rule Check Content and refining STIG Revision and Rule/content associations.

1.3.0
-----

Changes:

  - (App) New Collection Dashboard replaces much of the navigation previously performed in the Navigation Tree, as well as the separate Metrics report. 
  - (App) New STIG Revision Compare tool available from STIG Library node in Navigation Tree. 
  - (App) Addressed issue causing error when empty or undefined review arrays were POSTed.
  - (API) Increased default value for STIGMAN_API_MAX_JSON_BODY to 30MB.
  - (App) Updated dependencies to address dependabot-identified vulnerabilities.
  - (App) Adjusted matching criteria for Assets with website/db extended names. 

1.2.22
-----

Changes:

  - (App/API) Added support for display of additional Rule property "Version" (aka "STIG Id" aka "Rule_Ver") information in checklists, STIG Library, and Rule Content Panel (#871)
  - (API/Fix) Resolved issue preventing certain characters from being added to Review text fields (#874)
  - (App/Fix) Resolved issue preventing new user grants from being properly handled in windowed panel (#869)
  - (App) Prevent display grids from preserving state until specifically invoked (#865)
  - (App) Adjusted label for "Null" Status import option for better clarity (#878)
  - (App) Added UI indication and disabled Reject button when provided Status Text is longer than defined in specification (#876)
  - (Test) Updated expired test user tokens  (#864)

1.2.21
-----

Changes:

  - (App) Added CSV export button to User App Admin panel. (#856)
  - (App/Fix) Sort Assets in NavTree when building tree node (#855)
  - (API) Updates to node package dependencies (#845)
  - (App) Added a distinct logout button to navtree header (#844)
  - (App) Collection review workspace enhancements, batch editing uses new API endpoints for better performance (#835)
  - (App/Fix) Resolved overly persistent stig grid reload mask (#836)
  - (App/Fix) Fallback to navy logo on img error (#839)
  - (App/Fix) Enabled User grant delete button from User Admin interface (#840)
  - (App) Added sourcemap to support client debugging (#841)
  - (API/Fix) Fixed issue preventing AppData from loading reviewHistory > 5000 characters (#830)
  - (API) Added endpoints for batch POST of reviews (#832)
  - (App) Render rows to a markup cache in BufferView for better performance (#831)
  - (API) Refactor migrations; avoid mysql2 bugs by removing charset/collation directives (#829)
  - (Ops) Removed unused Docker-compose file envvars (#842)

1.2.20
-----

Changes:

  - (Fix) Resolved an issue that could prevent Asset Review Workspace tabs from opening. 
  - (Ops) Explicitly including csv-stringify module in pkg build config.

1.2.19
-----

Changes:

  - (Fix) Fixed an issue preventing export of grid data with buffered views. 
  - (App) Various CSS and UI optimizations and enhancements.
  - (App) Accept .ckl file imports with untraditional releaseinfo data.
  - (App) Disable submit option if review does not have a valid compliance result.

1.2.18
-----

Changes:

  - (App) Added tooltips to display "Other Assets" review content. 
  - (App) Preserve column filters when loading grid data.
  - (Fix) Addressed a bug causing an alert when viewing metrics with fresh reviews.
  - (Fix) Addressed a bug preventing Assets from being transferred to other Collections. 
  - (Fix) Addressed a bug preventing new Reviews from being manually changed when no commentary is provided by the user.
  - (Fix) Addressed a bug causing text to wrap instead of being truncated in the Collection Review workspace.
  - (Fix) Addressed a bug that could cause display issues for buffered grids at certain zoom levels.
  - (API) Addressed performance issue when querying Assets from large Collections by removing unnecessary grouping clauses.

1.2.17
-----

Changes:

  - (App) Added buffered views for Grids with poor performance when displaying very large Collection data.
  - (API) Adjustment to Metrics endpoints so that they serve data formerly returned from the statusStats projection.
  - (Fix) The two changes above comprise a hotfix addressing poor performance in some areas with very large Collections. 
  - (API) Compression enabled for API responses where appropriate.
  - (Tests) Adjusted STIGs used in tests to avoid collisions with standard benchmarkIds. 


1.2.16
-----

Changes:

  - (API/App) New Metrics Report replaces old Status Report; additional API endpoints added to support this feature.
  - (App) Various changes to UI for look/feel tuning.
  - (App) Local storage state provider added to preserve some user configuration of views across sessions.


1.2.15
-----

Changes:

  - (API/App) Auto-prune review history records using value specified in new Collection Setting. 
  - (API) hotfix: stig-asset update preserves existing mappings 
  - (API) Retry transactions on deadlock
  - (API/App/OAS) Remove special treatment for SCAP data, as all resultEngines are represented with equal prominence. 
  - (App) Limit service worker interceptions 


1.2.14
-----

Changes:

  - (App) Added a service worker to handle streaming downloads. 
  - (API) Added new endpoints to return datasets related to "unreviewed" rules for Assets. 
  - (API) Enhance request body for archive endpoints. 
  - (API) XCCDF export and parser changes
  - (OAS) Updates to OAS to better define acceptable requests. 
  - (API/OAS) Updates to pre-calculated statistics for STIG/Assets. Now includes totals for every possible result and status state, as well as totals for those states with "resultEngine" data.  


1.2.13
-----

Changes:

  - (UI) Hotfix addressing issue where CKL serializer was failing when parsing CKL with no root XML comment.


1.2.12
-----

Changes:

  - (API) Hotfix addressing issue #721: API is incorrectly storing and returning a JSON zero (0) instead of null for resultEngine. 


1.2.11
-----

Changes:

  - (API/App/OAS) Experimental streaming archive export of ckl files from Collection Management screen. 
  - (App) Easily create a new set of Asset-STIG assignments based off of a set of existing assignments. New filter behavior when selecting STIGs. 
  - (App) Added checkbox selection and CTRL-A shortcut options for selecting multiple grid items in several views. 
  - (API) New presentation for User grants includes Usernames and Display Names. Filtering now applies to Username and Display Name components, if present.
  - (API/App/OAS) Review Detail and Comment text fields are now limited to 32767 characters. 

1.2.10
-----

Changes:

  - (App) Refactored token handling for better Azure AD and Okta compatibility. Added new Envvars for configuration.
  - (App) Truncate the display of long Detail and Comment fields for increased performance and readability. Full text available when editing or by clicking "Full text" link.
  - (API) Updated SCAP map to reflect current differences between SCAP IDs and STIG IDs.  
  - (API/App/OAS) Updated checklist statistic calculations to account for new result Id options. Changed column name to "Other" to better reflect its contents. 
  - (API) Updated got dependency to 11.8.5

1.2.9
-----

Changes:

  - (App) Preview of Batch Edit feature in the Collection Review Workspace.
  - (App) Resolved an issue that could cause error pop-ups when tabs were closed. 
  - (App) Adjusted expected Eval STIG info elements.
  - (API) Updated dependencies (multer and express-openapi-validator) to resolve vulnerability found in one of their dependencies (dicer).
  - (API) Log response bodies for elevated requests.


1.2.8
-----

Changes:

  - (App) Added "What's New" pop-up feature
  - (App) Added "Dark Mode" preview feature
  - (App) Added Import Options to Collection Settings for granular control over the way Reviews imported from files are posted to the API. 
  - (API/OAS) Adjusted API and OAS to bring them into agreement.
  - (App) Added "Accept" button to Asset Review Workspace
  - (App) Updated fast-xml-parser to 4.0.7
  - (App) Created common Parser file that can be shared across the UI and stigman-watcher
  - (App) Updates to parser to support processing of Evaluate STIG comments, used to populate ResultEngine data. 

  - (DB) Includes a MySQL migration that:
    - Adds indexes to ``resultEngine`` JSON properties. 
    - Removes data in column ``resultEngine`` of ``review`` and ``review_history`` tables where it was automatically populated in previous migration.  

  **We recommend backing up your database before updating to any release with a database migration.**


Commits:

- 6e543c3d docs: Replaced "what's new" latin with more userbase-friendly English text, new pics, small documentation changes.
- 6bbc763c initial SM.WhatsNew
- 050baa41 dark-mode preview (#660)
- 009d1dca feat: control behavior of CKL/XCCDF imports (#659)
- fb7be174 fix: added schema "CollectionStatistics" for statistics property in the Collection(s)Projected response schema.  Resolves: #477 (#654)
- b96d7181 fix: further OAS/API reconciliation. (#650)
- 72397da4 fix: Client was looking for display, rather than displayName.  (#649)
- 1fa850da fix: Initial adjustments to OAS and API to bring the two into alignment. (#648)
- 03932e58 feat: accept button in asset review panel (#646)
- 2365895a deps: update client fast-xml-parser to 4.0.7 (#642)
- 8710da53 Update build.sh
- b53807ec workflow: checkout main for alpine workflow too

1.2.7
-----

Changes:

  - (API) Update dependency `minimist` to address a High severity vulnerability
  - (API/Tests) Review History endpoint fixes and new CI tests
  - (App) In the Collection/STIG Review checklist grid, the columns that count O, NF, NA, and NR were expanded to accommodate up to 4 digits. These columns remain fixed width and are not re-sizable by the user.
  - (App) In both the Asset/STIG Review and Collection/STIG Review checklist grids, the default visible columns were changed from "Group ID and Group Title" to "Group ID and Rule Title". This more closely reflects the observed preferences of many users.
  - (API) resultEngine property added to Review schema. This property is intended to hold data about automated sources of the Review Results. See the API Specification for more details. 

  - (DB) Includes a MySQL migration that:
    
    - Adds JSON column ``resultEngine`` to ``review`` and ``review_history`` tables. 
    - Where ``autoResult`` column is set to 1, sets value of resultEngine to  ``{type: "scap", product: "scc"}``

  **We recommend backing up your database before updating to any release with a database migration.**


Commits:

  - 9936c15 refactor: remove references to globalAccess and unneeded try/catch (#632)
  - 428784e feat: widen columns; default to groupId/ruleTitle (#640)
  - 99e6e17 feat: resultEngine property added to Review schema (#638)
  - 070b060 docs: include stub html directory (#639)
  - 62011d8 build: add doc build; build images on commit and tag (#637)
  - 4b2d0b9 mixed: Review History tests and fixes to structure and calculation dates  (#631)
  - a6b1c0c chore(deps): bump minimist from 1.2.5 to 1.2.6 in /api/source (#630)

1.2.6
-----

Changes:

  - (App) Rows in the Status and Finding report link to the corresponding Review tabs
  - (API/App) CKL filenames contain the STIG revision string
  - (App) Ensure the Label icon in the NavTree displays in all deployments

Commits:

  - 3ad3f21 fix: modify path to label.svg in NavTree (#626)
  - 17c4705 fix: provide specific revision string in suggested filename, in place of "latest" (#623)
  - ec8ebde feat: dblclick on a Status/Finding row opens the corresponding Review tab (#616)

1.2.5
-----
​
Changes:

  - (API/App) Release of new Asset Labelling feature. Tag Assets in a Collection with Labels 
  - (App) Navigation Tree filtering on Asset Labels. 
  - (App) Asset Labels are now displayed in various places in UI. 
  - (Docs) Documentation for new Asset Label feature available. See sections on the `Navigation Tree <https://stig-manager.readthedocs.io/en/latest/user-guide/user-guide.html#navigation-tree>`_ and `Collection Management - Labels <https://stig-manager.readthedocs.io/en/latest/user-guide/user-guide.html#labels-tab`_.
  - (App) Adjusted language used in Review Panel Attribution box for clarity.
  - (App) Restricted Collection modification options available in Application Management interface to better reflect overall application security approach. 
  - (App) Adjusted line spacing to loosen up grid views a little.

Commits:

- b662de4 feat: Collection labels (#605)
- 78b8db6 fix: remove listeners on destroy (#606)

1.2.4
-----

Changes:

- (API/App) Endpoint and UI for deployment-wide usage statistics
- (App) CKL export fixes
- (App) Changed incorrectly named column headers on the Collection Manage workspace
- (API/App) Require a compliance result (pass, fail, notapplicable) to submit a Review
- (Docs) Updates regarding "submit" status requirements
  
Commits:

- 8f0905f docs: updates regarding "submit" status requirements (#595)
- 86a9890 fix: require a compliance result to submit review (#594)
- b506920 fix: headers don't match API (#592)
- 0c7ecf5 fix: CKL export fails to include all rules (#591)
- 98025ce feat: endpoint and ui for /op/details (#570)

1.2.3
-----

Changes:

  - (App) Trim white space from exported CSV values
  - (API) Include request body when logging at level 4
  - (App) Corrected web app logic for XCCDF imports

Commits:

- a93f6fe fix: web app xccdf import logic (#582)
- 22cbfe7 feat: log request body when logLevel = 4 (#581)
- 4319979 feat: ExportButton trims values (#576)


1.2.2
-----
Changes:

- Fix a UI regresssion that incorrectly hides the "Accept" button and disables the "Reject" feature
- The experimental AppData feature now supports Review history items

Commits:

- fix: accept button incorrectly hidden (#571)
- feat: include review history in appdata export/import (#562)
- remove: CORS proxy for OIDC (#558)
- refactor: fetchStig/Scap logging (#557)
- chore: Build updates (#556) 
- doc: remove videos from source and build

1.2.1
-----
Changes:

- BREAKING API CHANGE: The OpenAPI schema for Collection was revised. ``Collection.workflow`` was removed. ``Collection.settings`` was introduced and is mandatory for POST/PUT requests.
- Resolved a bug where ``Collection.description`` was not being saved (#547)

Includes a MySQL migration that:

- Drops column ``collection.workflow``
- Adds column ``collection.settings`` as type ``JSON``
- Sets the value of column ``settings`` for each record in table ``collection`` based on the value of ``metadata.fieldSettings`` if it exists, and ``metadata.statusSettings`` if it exists. If those values do not exist, then the default value of settings is used.

  .. code-block:: json
    
    {
      "fields": {
        "detail": {
          "enabled": "findings",
          "required": "findings"
        },
        "comment": {
          "enabled": "always",
          "required": "always"
        }
      },
      "status": {
        "canAccept": true,
        "minAcceptGrant": 3,
        "resetCriteria": "result"
      }
    }

- Removes the keys ``fieldSettings`` and ``statusSettings`` from the value of column ``metadata`` for each record in table ``collection``

**We recommend backing up your database before updating to any release with a database migration.**

Commits: 

- 6622d39 test: collection settings; object creation (#550)
- 675e031 feat: adds Collection.settings (#548)
- fa55151 doc: synchronize build with source (#543)
- 9c071ff fix: add additional images to client dist (#544)

1.2.0
-----
Changes:

- structured logging output from the API as a JSON stream
- build script to generate a minimized client distrubution
- build script to generate signed binaries of the API for Windows and Linux
- updates to the CD workflows
- dependency updates which resolve recently reported security vulnerabilities
- minor bug fixes

Commits:

- 13e4d1a dev: api distribution build script (#541)
- 434e984 refactor: remove client from event path (#540)
- b1903c6 fix: register xtype for STIG revision grid (#539)
- bb374d1 fix: escape quotes in Welcome title and message (#538)
- 459ef3e refactor: JSON_EXTRACT() instead of JSON_VALUE() (#537)
- 19892dc chore: increment copyright year (#536)
- d93bb4d chore: update node modules (#535)
- 7fad835 dev: client distribution build script (#534)
- dff8a9e feat: JSON logging and supporting code (#530)
- 3ac29a5 docs:  updated Logging, Environment Variables, Setup and Deployment docs. (#524)

1.1.0
-----
Includes breaking changes to the OpenAPI definition that affect clients such as `STIG Manager Watcher <https://github.com/NUWCDIVNPT/stigman-watcher>`_. Some properties of the schemas for ``Review...`` and ``ReviewHistory...`` have been changed, renamed or removed:

- ``resultComment`` is renamed to ``detail``
- ``actionComment`` is renamed to ``comment``
- ``action`` is removed
- ``status`` value can be either a string or an object. See the definition for details.

Includes a MySQL migration that changes the schema for tables ``review`` and ``reviewHistory``. 

- The running time of the migration depends on the number of records in those tables. 
- The migration also drops the small, static table ``action``.
- We recommend backing up the database before updating to any release with a database migration. 

Commits:

- ui: styling tweaks (#517)
- docs: consolidated some redundant docs, added info about collection settings, updated screenshots (#514)
- feat: update UI labels (#513)
- feat: review status handling (#511)
  
1.0.42
------
- fix: CKL comments restored (#505)
- oas: Various OAS changes to enable better response validation (#500)
- fix: always sort Collection Review to top (#501)

1.0.41
------
- fix: filter grid on asset name (#498)
- feat: UI support for STIG/revision delete (#491)
- refactor: unhandled rejections (#490)
- doc: Additional documentation updates, links. (#489)
- doc: Added project security policy, security docs, docker trust public key, stigman sample .ckl (#486)
- feat: choice to export mono- or multi-STIG CKLs (#480)
- refactor: await _migrations table (#476)

1.0.40
------
- fix: allowReserved for office query param (#474)
- deps: rm connect,compression, request; update xlsx-template (#473)
- feat: STIG Library feature introduced (#472)
- refactor: ui rendering (#471)
- refactor: reduce web client smells (#470)
- feat: column filters (#469)
- chore: fictionalize appdata city (#468)
- chore: remove unused client dockerfile (#467)
- fix: encode office query param (#466)
- feat: userObject.display tries username or servicename (#463)

1.0.0-beta.39
-----------------------
This is the last release to have a `beta` designation. Several UI enhancements are introduced, including:

- `New names for the Review commentary fields <https://stig-manager.readthedocs.io/en/latest/user-guide/user-guide.html#review-panel>`_
- `New settings for Reviews in Collection Management <https://stig-manager.readthedocs.io/en/latest/user-guide/user-guide.html#collection-settings-tab>`_
- `Ability to display a custom image and text in the Home tab Welcome panel <https://stig-manager.readthedocs.io/en/latest/installation-and-setup/environment-variables.html#id3>`_

There is a database migration included in this release that moves the data in table stats_asset_stig to stig_asset_map.

- feat: Welcome message enhancements (#461)
- feat: experimental CORS proxy for OIDC (#460)
- docs: updated screenshots, added care and feeding, autoresult, and CORS sections, updated terminology, many other small fixes. (#462)
- feat: welcome widget icon/text can be customized (#458)
- feat: UI support for rejectedCount, minTs, maxTs (#456)
- feat: updated loading screen for the UI (#457)
- feat: statusStats with rejectCount, minTs, maxTs (#454)
- fix: query param inadvertently marked as path param in Asset/getChecklistByAsset (#453)
- feat: GET /op/definition endpoint with JSONPath (#452)
- feat: Web app updates (#442)
- feat: relaxed CKL revision checks by default (#450)
- deps: remove unused patch-package (#449)
- test: limit bootstrap wait to 45 seconds (#448)
- deps: updating jwks-rsa to 2.0.4 removes axios (#446)
- refactor: move stats to stig_asset_map (#431)
- refactor: reduce duplicated code for data migrations (#433)
- feat: adds new review-history endpoints (#417)

1.0.0-beta.38
-----------------------
- fix: don't sort for history projection (#419)
- doc: include build in Docker image and serve with express (#414)
- fix: setting stig-asset access was generating 404 incorrectly  (#416)
- fix: don't sort reviews to workaround MySQL bug (#411)
- feat: deleting a STIG updates related tables (#409)
- feat: UI keeps tokens refreshed (#408)

1.0.0-beta.37
-----------------------
- feat: support generic OIDC providers (#403)
- fix: cci param, added checks for projections to tests (#404)
- feat: Adds metadata handling for Assets and Collections (#396)
- feat: STIGMAN_DEV_RESPONSE_VALIDATION environment variable (#398)
- fix: access control checks for assets (#400)
- chore: update sample appdata (#394)
- fix: implement delete STIG revision (#383)
- feat: Removed global_access privilege (#386)
- feat: UI for asset transfers (#385)
- feat: switched OpenAPI validation/router library to express-openapi-validator (#382)
- feat: continue on corrupted member of STIG zip (#377)
- feat: continue on error when importing zips of STIGs (#376)
- feat: All users can access Collection Review (#375)
- fix: use promise interface for conn.query() (#372)
- fix: implement CCI endpoints (#363)
- fix: recalculate stats on Review delete (#367)
- feat: add name and email to User object (#369)
- fix: UI sends correct projections (#368)
- fix: implement GET /stigs/rules/{ruleId} (#354)

Introduced new envvars, which deprecate existing envvars in some cases:

- ``STIGMAN_OIDC_PROVIDER`` deprecates ``STIGMAN_API_AUTHORITY``
- ``STIGMAN_CLIENT_EXTRA_SCOPES`` is new
- ``STIGMAN_CLIENT_ID`` deprecates ``STIGMAN_CLIENT_KEYCLOAK_CLIENTID``
- ``STIGMAN_CLIENT_OIDC_PROVIDER`` deprecates ``STIGMAN_CLIENT_KEYCLOAK_AUTH`` and ``STIGMAN_CLIENT_KEYCLOAK_REALM``
- ``STIGMAN_JWT_PRIVILEGES_CLAIM`` deprecates ``STIGMAN_JWT_ROLES_CLAIM``
- ``STIGMAN_SWAGGER_OIDC_PROVIDER`` deprecates ``STIGMAN_SWAGGER_AUTHORITY``

1.0.0-beta.36
-----------------------
- fix: UI now handles missing vulnDiscussion (#361)
- doc: Fixed link to create new github issues (#358)

1.0.0-beta.35
-----------------------
- doc: document Attachment feature; reorganize with minor terminology changes. (#357)
- feat: Review metadata and attachments (#353)
- fix: implement MySQL deleteReviewByAssetRule method (#351)
- chore: remove CKL/SCAP import endpoint (#343)
- doc: Updates to contribution docs, node.js envvar setting (#339)
- fix: Format roles claim for optional chaining (#338)

There is a database migration included in this release that adds a metadata column to the review table with a default value of {}. No other changes are made to the schemas and no data is moved, modified, or deleted.


1.0.0-beta.34
-----------------------
- fix: Refactor Env.js/keycloak.json handling (#335)
- feat: SCAP benchmarkId Map (#329)
- feat: History -> Log, include current Review (#328)
- feat: Dynamically generate Env.js and keycloak.json (#327)
- feat: Verbose logging of AUTH bootstrap errors (#325)
- docs: contributing information updated (#326)
- build(deps): bump urllib3 from 1.26.4 to 1.26.5 in /docs (#321)
- docs: Updates to project Contributing docs (#318)
- chore: Matched workflow name and job name
- feat: gave Iron Bank its own workflow file so it can be run independently (#315)

1.0.0-beta.33
-----------------------
- doc: relative link to video was wrong for top-level index.rst file (#311)
- doc: updates to docs and tests relating to Not Reviewed functionality. Workflow change for new Test Collection folder. (#308)
- feat: Accept all XCCDF result values (#307)

1.0.0-beta.32
-----------------------
- fix: Throttle requests for Submit All (#306)
- docs: follow code.mil guidance on license.md file (#301)
- build(deps): bump hosted-git-info from 2.8.8 to 2.8.9 in /api/source (#302)
- fix: Check for collectionId in event handlers (#299)
- build(deps): bump handlebars from 4.7.6 to 4.7.7 in /api/source (#296)
- build(deps): bump lodash from 4.17.19 to 4.17.21 in /api/source (#297)
- fix: Asset endpoints: test coverage, implementation (#295)

1.0.0-beta.31
-----------------------
- fix #275: handle rule-result without check (#290)
- feat: Drag from Review History (#288)
- fix #145: Review vetting for all users (#285)
- feat: Endpoint updates (#284)
- docs: Added default_group to prevent guid generation, removed doctrees, added a bit of info to Contributing doc. (#281)
- chore: remove obsolete docker dir (#278)
- fix #276: remove reference to database 'stigman'

1.0.0-beta.30
-----------------------
- fix #270: ROLE element default value 'None' (#272)
- fix #266: sanitize exported filenames (#273)
- ironbank => development sign+image

1.0.0-beta.29
-----------------------
- fix #256: CKL site/instance handling; UI refactor (#268)

1.0.0-beta.28
-----------------------
- fix #264: Display feedback for rejected reviews (#265)
- fix: Filter members only on .xml extension  (#260)
- fix: New/Delete => Assign/Unassign (#261)
- fix: SET NAME to utf8mb4 encoding (#262)
- feat: format roles claim with bracket notation and optional chaining (#190)
- fix: cast userId as char (#249)
- fix: handle property chains with hyphens (#257)
- fix: create date is not ISO8601 UTC (#189)
- fix: response schema for /opt/configuration (#147)
- fix: Attach => Assign STIG (#118)
- fix: log servicename if present (#198)

1.0.0-beta.27
-----------------------
Migrates MySQL
Migration notes included in #251 

- feat: Ext.LoadMask looks for store.smMaskDelay (#254)
- fix: batch import continues on error, refreshes grids (#252)
- fix: increased length of asset name,ip,mac,fqdn and allow more nulls  (#251)

1.0.0-beta.26
-----------------------
- fix: sticky bit for world-writable dirs created by npm (#245)
- feat: mercury-medium color is more blue (#243)
- feat: Tooltips for Review labels and headers (#240) (#242)
- doc: updates regarding ckl -> stigman field mappings, clients folder when running from source (#241)
- build(deps): bump urllib3 from 1.26.3 to 1.26.4 in /docs (#238)
- feat: Manage Assets -> multi-delete (#232), columns (#236)

1.0.0-beta.25
-----------------------
- chore: remove unused oracledb dependency (#229)
- Multiple fix and features (#228)
- fix: fetch STIG/SCAP if configured at bootstrap (#227)

1.0.0-beta.24
-----------------------
- Multiple fixes and features (#225)
- fix: Exports on multiple reports (#224)
- doc: Added a little more about .ckl and data handling (#223)
- build(deps): bump y18n from 3.2.1 to 3.2.2 in /api/source
- fix: reduce deadlock potential (#216)

1.0.0-beta.23
-----------------------
- fix: remove hard-coded reference to schema (#211)
- feat: UI shows collectionId (#210)
- feat: progress bar styling (#209)
- Common tasks elaboration, other edits (#208)
- feat: case-sensitive collation for benchmarkId in MySQL (#206)
- feat: name-match params and duplicate handling (#204)
- doc: Added some documentation about new .ckl archive export feature. (#203)
- adjust path to docker readme (#196)

1.0.0-beta.22
-----------------------
- fix: Improved output when importing STIG XML (#192)
- fix: case-insensitive filename matching (#192)
- feat: Collection export management (#169)
- docs: Build documentation with Sphinx (#188)

1.0.0-beta.21
-----------------------

- fix: Set Ext.Layer z-index default = 9000 (#185)

1.0.0-beta.20
------------------
- fix: Log username for unauthorized requests (#178)
- feat: File uploads use memory storage (#180)

1.0.0-beta.19
---------------
- feat: Export Collection-STIG CKL archive (#176)
- fix: inline row editors (#167) (#174)

1.0.0-beta.18
--------------------
- feat: Preview tabs for workspaces (#172)

1.0.0-beta.17
----------------------
- fix: Reviews for non-current ruleIds (#155)
- fix: Saving unchanged Review updates timestamp (#153)
- fix: increase test coverage (#151)

1.0.0-beta.16
-----------------------
- feat: Asset-STIG CKL import UI enhancements (#86) (#143)
- fix: GET /collections/{collectionId}/poam fail with 500 (#141) (#142)
- fix: Implement submit all from Asset-STIG UI (#88)
- feat: Iron Bank base image in CD workflow (#139)
- feat: HEALTHCHECK and FROM argument (#108)
- feat: Support older MySQL syntax and check minimum version (PR #137)
- fix: access is set for lvl1 users only (#121)
- fix: Make note of accessLevel requirements (#102)
- fix: Remove unused Findings projections (#101)

1.0.0-beta.15
-----------------------
- feat: check MySQL version during startup (#136)
- fix: Support older MySQL syntax for now (#135)
- fix: access is set for lvl1 users only (#121)
- fix: Make note of accessLevel requirements (#102)
- fix: Remove unused Findings projections (#101)

1.0.0-beta.14
-------------------------
- fix: Remove standard feedback widget (#120)
- more info about workflow, possible configurations, and default db port update (#127)
- Merge PR #119 from cd-rite
- Added commented-out test for Issue #113 (#115)
- API testing README (#114)

1.0.0-beta.13
------------------------
- fix: API issues #97 #98 (#111)
- fix: Tab stays open on Collection Delete (#92)
- fix: Individual Findings not listing STIG (#96)
- fix: Delete Grant is always active (#81)

1.0.0-beta.12
-------------------------
- Merge pull request #93
- Remove typeCast handling for JSON (#62)
- fix: UI Import results completion message (#58)
- fix: collection review filter (#64)
- HTML entities in CKL are not decoded (#63)
- Update jwks-rsa to 1.12.1(#74)

1.0.0-beta.11
---------------------
- Experimental appdata example (#66)

1.0.0-beta.10
------------------------
- Bump ini from 1.3.5 to 1.3.8 in /api/source (#60)
- Action Comments do not import if there is no Action (#61)

1.0.0-beta.9
------------------------
- Provide guidance for non-localhost browsers (#54)
- Client CKL/SCAP import less verbose (#55)
- (fix) UI: Metadata has malformed History property
- Comment out unimplemented endpoints

1.0.0-beta.8
-----------------------
- (fix) #47 ungranted reviews for lvl1 (#48)
- Update import_realm.json
- redirects include HTTPS and remove MQTT
- (fix) Empty string scope not failing #42
- Added more comprehensive testing, altered workflow for efficiency (#43)

1.0.0-beta.7
-------------------
- (fix) stigGrant projection #40

1.0.0-beta.6
--------------------
- ovalCount based on ruleId instead of benchmarkId

1.0.0-beta.5
------------------------
- Migration of v_current_rev to support draft STIGs

1.0.0-beta.4
----------------------
- BUG: "All checks" drop down filter doesn't work (#32)
- Additional collection review updates
- Version in package.json
- Handle concurrent Ext.Ajax requests that delete pub.headers

1.0.0-beta.3
-----------------
Fixes:
- UI: Collection->Reports->Findings workspace failed to open
- API: Issue #29 max json body and upload envvars
- UI: Closing message box was confirming action
- UI: Import STIG message box mistitled
- UI: Call updateToken() before direct fetch/xhr

1.0.0-beta.2
-------------------
Fixed GitHub Issue #27. STIG checklist imports were critically affected by a regression introduced with beta.1

1.0.0-beta.1
----------------------
Numerous enhancements and bug fixes, including token handling and better concurrency. The project is ready for non-production deployments and pilots to demonstrate suitability for first production release.

1.0.0-beta
-------------------

This is the initial beta release of STIG Manager




