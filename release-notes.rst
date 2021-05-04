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




