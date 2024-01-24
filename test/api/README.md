# API testing with Postman

## Required tooling
- Node.js
- [newman](https://www.npmjs.com/package/newman) (global install)
- [newman-reporter-htmlextra](https://www.npmjs.com/package/newman-reporter-htmlextra)


## Optional tooling
- [Postman](https://www.postman.com/downloads/)

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

## Running the Tests

### From the Command Line Using newman
- Ensure the newman npm module is installed. If not, run `npm install -g newman`
- From the /test/api folder of the project repo, run the `runFailsOnly.sh` bash script.
- Test result summaries are output to the console, and detailed test reports are output to the `/test/api/newman`` directory.

### From Postman UI

- Open Postman and import the collection and environment files from the `/test/api` directory of the project repo.
- Run requests individually, or as part of a Collection or Folder "run" using the `collectionRunnerData.json` file, if user iterations are needed.


## Test Components

Located in the `/test/api directory of the project repo:

- `postman_collection.json`  The Postman Collection of API tests.
- `postman_environment.json`  The Postman Environment for the API tests.
- `collectionRunnerData.json`  The data file used by the newman/Postman Collection Runner to run iterations of the tests. Each iteration is specific to a user with different levels of access and grants to Collections maintained by the API. 
- `runFailsOnly.sh`  A bash script that runs the tests using newman, and outputs a summary of the results to the console. Detailed test reports are output to the /test/api/newman directory.  Tests are run in groups defined by the top-level folders of the Postman Collection. 
- `form-data-files/*`  Test data files sent by Postman/newman to the API. Includes several sets of data to populate the API with data the tests expect, and several reference STIGs to use in the tests.  If using the Postman UI, you may need to adjust Postman settings to allow access to this folder locally. 

## Test Policy

- All PRs to the project repo must pass all API tests before they will be accepted.
- All PRs to the project repo should include new or updated API tests that cover the changes made by the PR to the API.

## Test Coverage

- The API tests cover all endpoints of the API, and all HTTP methods supported by the API.
- The PR Workflow running the tests will also generate a coverage report showing how much of the API code is covered by the tests.


