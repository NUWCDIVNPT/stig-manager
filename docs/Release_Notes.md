# Release Notes

## Releases

### 1.0.0-beta
This is the initial beta release of STIG Manager

### 1.0.0-beta.1
Numerous enhancements and bug fixes, including token handling and better concurrency. The project is ready for non-production deployments and pilots to demonstrate suitability for first production release.

### 1.0.0-beta.2
Fixed GitHub Issue #27. STIG checklist imports were critically affected by a regression introduced with beta.1

### 1.0.0-beta.3
Fixes:
- UI: Collection->Reports->Findings workspace failed to open
- API: Issue #29 max json body and upload envvars
- UI: Closing message box was confirming action
- UI: Import STIG message box mistitled
- UI: Call updateToken() before direct fetch/xhr