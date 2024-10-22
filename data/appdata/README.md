## Demonstration Application Data

Sample data that demonstrates the features of STIG Manager is provided in the `data/appdata` directory of the project repo.  This data is intended to be loaded into a fresh STIG Manager installation, as loading it will wipe out all existing data in the system.  The sample data was automatically generated and does not represent an actual system.

The sample data can be loaded from the web client:

- `Application Management -> Export/Import Data -> Replace Application Data...`
- Select the `data/appdata/demo-appdata.jsonl.gz` file from the repo. The data may take a few 10s of seconds to load.


Refresh the browser to see the new data. 

If you are not running with our demonstration Keycloak container, you may need to grant yourself access to the Collections included in the sample data using the `Application Management -> Collections` interface.
