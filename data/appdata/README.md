## Demonstration Application Data

Sample data that demonstrates the capabilities of STIG Manager is provided in the `data/appdata` directory of the project repo.  This data is intended to be loaded into a fresh STIG Manager installation, as loading it will wipe out all existing data in the system except for the imported reference STIGs.  The sample data was automatically generated and does not represent an actual system.

Before loading the demonstration data, the Reference STIGs must be made available to STIG Manager. From the web client:

- `Application Management -> STIG Benchmarks -> Import STIGs`
- Import the `data/appdata/stigs-for-sample-data.zip` file from the repo. This file contains all STIGs required for the sample data.

After the STIGs are imported, the sample data can be loaded from the web client:

- `Application Management -> Application Info -> Replace Application Data...`
- Select the `data/appdata/appdata-small.zip` file from the repo. The data may take a few 10s of seconds to load.


Refresh the browser to see the new data. 

If you are not running with our demonstration Keycloak Container, you may need to grant yourself access to the Collections included in the sample data using the `Application Management -> Collections` interface.


### Sample STIGs

The STIGs included are also available from DISA's [STIG Library Compilation:](https://public.cyber.mil/stigs/compilations/)
- Application_Security_Development_STIG
- CAN_Ubuntu_18-04_STIG
- Google_Chrome_Current_Windows
- IIS_10-0_Server_STIG
- IIS_10-0_Site_STIG
- Microsoft_Access_2016
- Microsoft_Excel_2016
- Microsoft_Office_System_2016
- Microsoft_Outlook_2016
- Microsoft_Project_2016
- Microsoft_Word_2016
- Mozilla_Firefox_STIG
- MS_Dot_Net_Framework
- MS_SQL_Server_2016_Database_STIG
- MS_SQL_Server_2016_Instance_STIG
- Oracle_Database_12c_STIG
- PostgreSQL_9-x_STIG
- RHEL_7_STIG
- Windows_10_STIG
- Windows_Server_2016_STIG