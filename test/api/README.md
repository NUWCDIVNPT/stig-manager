# API testing
This project contains a set of Mocha and Chai tests for stig-manager.

## Runtime environment
### Authentication Server
Run ***ONE*** of the following:
- A container instance of [our demo Keycloak image](https://hub.docker.com/r/nuwcdivnpt/stig-manager-auth) 
   > Example with docker
    ```
   docker run --name stig-manager-auth -p 8080:8080 nuwcdivnpt/stig-manager-auth
   ```
  

- An HTTP server on port 8080 that accepts requests for the content in `./mock-keycloak`

   > Example with Python3:

   ```
   cd mock-keycloak && python3 -m http.server 8080 &
   ```

### Database
- Run an instance of [the official MySQL image](https://hub.docker.com/_/mysql)

   > Example with docker
    ```
   docker run --name stig-manager-db \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpw \
  -e MYSQL_DATABASE=stigman \
  -e MYSQL_USER=stigman \
  -e MYSQL_PASSWORD=stigman \
  mysql:8
   ```

### API
- Run the API so it answering requests at `localhost:64001/api`, and can communicate with the Authentication Server and database.
- The API can be run in a dev environment such as Visual Studio Code or in a container

   > Example with docker
   ```
  docker run --name stig-manager-api \
  -p 64001:54000 \
  nuwcdivnpt/stig-manager
   ```



## Installation

To install the dependencies required to run the test suite, run this command from the test folder:

```
npm install
```

Ensure that testConfig.js is configured correctly. This file contains the base URL for the API and access token for the admin test user. 
```test/api/mocha/testConfig.js```


## Usage

The test suite uses Mocha as the test runner and Chai for assertions. 

To run the tests for local development, use the following bash script:

```test/api/runMocha.sh``` (use -h flag for help)

In CI/CD use ```npm test``` to run tests. 




## How to Write Tests

The test suite follows these conventions:

- All access tokens used in the tests are valid when using the ["test" keycloak container maintained here.](https://github.com/NUWCDIVNPT/stig-manager-auth). 
- The main directory for all testing files is located at ```test/api/mocha```.
- Tests validating the basic functionality of our endpoints are found in ```test/api/mocha/data```.
- Each subdirectory within ```test/api/mocha/data``` is organized by API tag
- Test files generally adhere to the naming convention ```<apiTag><HTTPMethod>.test.js``` (e.g., ```assetPatch.test.js```).
- The ```test/api/mocha/crossBoundary``` directory contains tests for Level 1 cross-boundary scenarios.
- Integration tests are located in ```test/api/mocha/integration```. Integration tests, as defined here, involve calling a set of related endpoints together to validate major application functionalities. These differ from the more focused, unit-like data tests that target individual API endpoints.
- ```iterations.js``` defines the various iterations a test or group of tests will execute. This structure supports running the same test across multiple scenarios. Iterations contain an iteration name (often the test user name), a user Id as found in the test data set, and a test access token for that user.
- Most tests reference corresponding ```referenceData.js``` and ```expectations.js``` files. These files contain the "answers" or expected data against which the API responses are validated.
  - ```referenceData.js``` typically contains static or more global data about the tests or API paths.
   - ```expectations.js``` contains data specific to the current test iterations (e.g., different user scenarios) and controls whether a test should run for a particular iteration.


#### Test Naming conventions

- top-level describe: ```describe('<HTTPMethod> - <APITag>', function () ``` Example: ```describe('DELETE - Asset', function ()```
- Iteration-specific describe (used by runMocha.sh to run for a specific iteration): ```describe(iteration:${iteration.name}`, function () ```
- Endpoint-level describe: ```describe('<operationId> - <endpointPath>', function ()``` Example: ```describe('deleteAssetMetadataKey - /assets/{assetId}/metadata/keys/{key}', function ()```

Make sure these files are correctly set up before running the tests.

## Test Policy

- All PRs to the project repo must pass all API tests before they will be accepted.
- All PRs to the project repo should include new or updated API tests that cover the changes made by the PR to the API.

## Test Coverage

- The API tests cover all endpoints of the API, and all HTTP methods supported by the API.
- The PR Workflow running the tests will also generate a coverage report showing how much of the API code is covered by the tests.


