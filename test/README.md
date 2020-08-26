Testing Preparation Steps:
- Import `STIGMan_testing_realm.json` into Keycloak.
- Import `STIGMan tests.postman_collection.json` into Postman.
- Import `STIGMan Env.postman_environment.json` into Postman.
- Application test data (`stig-manager-appdata.json.zip`) should be loaded through the STIGMan GUI or the Postman GUI with the request in the LoadTestData folder. Postman does not easily let you send a file as part of a request in Collection Runner (Should work fine in Newman, though.)

Testing Notes:

- Recommend 7 iterations in collection runner, with current set of test/runner data (`collectionRunnerData.json`).
- The Environment file provided should represent test states as expected in Iteration 1 of the Collection Runner data.
- Currently, GETs folder is in best shape. Others are a WIP.

