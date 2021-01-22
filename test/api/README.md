# API testing with Postman

## Required tooling
- Node.js
- [newman](https://www.npmjs.com/package/newman) (global install)

## Optional tooling
- [newman-reporter-htmlextra](https://www.npmjs.com/package/newman-reporter-htmlextra)
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
- Run the API so it can communicate with the Authentication Server and database and is listening on port 64001

   > Example with docker
   ```
  docker run --name stig-manager-api \
  -p 64001:54000 \
  nuwcdivnpt/stig-manager
   ```   

## Running the Tests


```
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 1 \
  --folder "LoadTestData" -r cli,htmlextra  \
  --reporter-htmlextra-export \
  ./newman/dataPreloadReport.html

newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 7 \
  --folder "GETs" -r cli,htmlextra \
  --reporter-htmlextra-export \
  ./newman/GetsReport.html

newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 7 \
  --folder "POSTS, Puts, Patches, and Deletes" -r cli,htmlextra \
  --reporter-htmlextra-export \
  ./newman/PPPDReport.html

newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 2 \
--folder "STIGS" -r cli,htmlextra \
--reporter-htmlextra-export \
./newman/stigsReport.html
```