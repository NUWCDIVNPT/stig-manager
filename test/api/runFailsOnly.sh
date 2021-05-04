#!/bin/bash

echo "LoadTestData"
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 1 \
  --folder "LoadTestData" -r cli,htmlextra  \
  --reporter-cli-no-assertions \
  --reporter-cli-no-console \
  --reporter-htmlextra-showOnlyFails \
  --reporter-htmlextra-export \
  ./newman/dataPreloadReport.html | grep -A18 '┌─────'

echo "GETs"
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 7 \
  --folder "GETs" -r cli,htmlextra \
  --reporter-cli-no-assertions \
  --reporter-cli-no-console \
  --reporter-htmlextra-showOnlyFails \
  --reporter-htmlextra-export \
  ./newman/GetsReport.html | grep -A18 '┌─────'

echo "POSTS, Puts, Patches, and Deletes"
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 7 \
  --folder "POSTS, Puts, Patches, and Deletes" -r cli,htmlextra \
  --reporter-cli-no-assertions \
  --reporter-cli-no-console \
  --reporter-htmlextra-showOnlyFails \
  --reporter-htmlextra-export \
  ./newman/PPPDReport.html | grep -A18 '┌─────'

echo "STIGs"
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 2 \
--folder "STIGS" -r cli,htmlextra \
--reporter-cli-no-assertions \
--reporter-cli-no-console \
--reporter-htmlextra-showOnlyFails \
--reporter-htmlextra-export \
./newman/stigsReport.html | grep -A18 '┌─────'

echo "LVL1 Cross Boundary"
newman run postman_collection.json -e postman_environment.json -d collectionRunnerData.json -n 1 \
--folder "LVL1 cross-boundary tests" -r cli,htmlextra \
--reporter-cli-no-assertions \
--reporter-cli-no-console \
--reporter-htmlextra-showOnlyFails \
--reporter-htmlextra-export \
./newman/lvl1Report.html | grep -A18 '┌─────'
