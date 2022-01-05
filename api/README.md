# STIG Manager API for Node.js

## Required Node version
The API requires Node 14.0.0 or greater

## Building binaries
- Read the comments in `build.sh` regarding build requirements
- Run `./build.sh` or `build.sh --sign`
- Binaries are written to `./bin`
- Archives with launcher scripts are written to `./dist`

## Configuring and running the API
The API is configured through [environment variables](../docs/Environment_Variables.md). The entry point is `index.js`
