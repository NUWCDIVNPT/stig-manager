# Release Notes

## Releases

### 1.0.0-beta.11
- Experimental appdata example (#66)
### 1.0.0-beta.10
- Bump ini from 1.3.5 to 1.3.8 in /api/source (#60)
- Action Comments do not import if there is no Action (#61)
### 1.0.0-beta.9
- Provide guidance for non-localhost browsers (#54)
- Client CKL/SCAP import less verbose (#55)
- (fix) UI: Metadata has malformed History property
- Comment out unimplemented endpoints
### 1.0.0-beta.8
- (fix) #47 ungranted reviews for lvl1 (#48)
- Update import_realm.json
redirects include HTTPS and remove MQTT
- (fix) Empty string scope not failing #42
- Added more comprehensive testing, altered workflow for efficiency (#43)

### 1.0.0-beta.7
- (fix) stigGrant projection #40

### 1.0.0-beta.6
- ovalCount based on ruleId instead of benchmarkId

### 1.0.0-beta.5
- Migration of v_current_rev to support draft STIGs

### 1.0.0-beta.4
- BUG: "All checks" drop down filter doesn't work (#32)
- Additional collection review updates
- Version in package.json
- Handle concurrent Ext.Ajax requests that delete pub.headers

### 1.0.0-beta.3
Fixes:
- UI: Collection->Reports->Findings workspace failed to open
- API: Issue #29 max json body and upload envvars
- UI: Closing message box was confirming action
- UI: Import STIG message box mistitled
- UI: Call updateToken() before direct fetch/xhr

### 1.0.0-beta.2
Fixed GitHub Issue #27. STIG checklist imports were critically affected by a regression introduced with beta.1

### 1.0.0-beta.1
Numerous enhancements and bug fixes, including token handling and better concurrency. The project is ready for non-production deployments and pilots to demonstrate suitability for first production release.

### 1.0.0-beta
This is the initial beta release of STIG Manager



