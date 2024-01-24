# STIG Manager Reference UI

The reference UI client provided by the project is implemented as a Single Page Application (SPA) using ExtJS 3.4.  It exercises most, but not all of the API endpoints. 

## Setting Up the Client for Development

- From the `/client/src/js/third-party/` directory, run `npm ci` to install the required dependencies.
- For development, in most cases the API configuration should specify the following envvar and value: `STIGMAN_CLIENT_DIRECTORY: "../../client/src"`.


## Building the Client for Distribution

Requires:
- nodejs
- uglify-js

From the `/client` directory, run the `build.sh` bash script.  The output will be in the `/client/dist` directory.