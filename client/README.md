# STIG Manager Web App

### Running the STIG Manager API and Web App from source

You must build the web app prior to starting the API. Assuming your shell is at the root of this repository:

```
$ cd client
$ ./build.sh
$ cd ../api/source
$ npm ci
$ node index.js

```

### If you wish to develop or modify the web app code

You must install the required modules. Assuming your shell is at the root of this repository:

```
$ cd client/src/js/modules
$ npm ci
```

and invoke the API with the envar `STIGMAN_CLIENT_DIRECTORY` set to `../../client/src`

```
$ cd ../api/source
$ npm ci
$ STIGMAN_CLIENT_DIRECTORY=../../client/src node index.js
```

