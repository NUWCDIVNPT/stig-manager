# STIG Manager Classic for Docker

The files in this branch create a demonstration instance of STIG Manager Classic running in Docker containers so you can become familiar with the interface and features. We hope you will agree the software is useful and this encourages you to contribute to our Project.

The technologies used by STIG Manager Classic are deprecated and the Project's intent is to use the Classic version for reference while modernizing the API and refactoring the UI. 

**STIG Manager Classic for Docker is not intended for production use.**


## Requirements
To run the orchestration, you must:
- Install Docker and `docker-compose`
- Clone this repository to a directory on your development system
- Have an account on Docker Hub
- Pull the Oracle Database 12.2.0.1 image using your Docker Hub account

*The initialization process has dependencies requiring you to run the orchestration on a Linux host. We will remove this dependency shortly and will support Docker Desktop for Windows and Mac.*

## Limitations of the Classic orchestration
- The Apache server is configured to perform Basic Authentication
- You cannot reliably logout of Basic Authentication without closing the browser. The logout function in STIG Manager does not work with all browsers when using Basic Authentication. The new API and client use OpenID Connect tokens and the logout feature works as designed.
- Only a closed source database (Oracle) is supported

## Orchestration overview and instructions

The orchestration starts two containers:

- Apache 2.4 serving the API and web client UI on TCP port 50443
- An Oracle 12.2.0.1 database with no network ports exposed

The orchestration bind mounts the `./stigman-init` directory in both containers. The STIG Manager Classic initialization script in this directory expects the Docker container names will be `docker_db_1` and `docker_web_1`, which are the default values when running the orchestration from the `docker` directory. 

### 1. Checkout and pull the Oracle Database image from DockerHub
STIG Manager Classic only supports an Oracle Database backend. The orchestration makes use of the official Oracle Database 12.2.0.1 image available from Docker Hub. Because Oracle Database is not open source, you will need to login to Docker Hub and agree to Oracle's license terms before checking out the image. [Go here and click "Proceed to Checkout" to agree to Oracle's terms.](https://hub.docker.com/_/oracle-database-enterprise-edition)

Following this, we recommend pulling the image before running `docker-compose`

    docker login
    docker pull store/oracle/database-enterprise:12.2.0.1-slim

### 2. Clone our Project and switch to the `classic` branch
    git clone https://github.com/NUWCDIVNPT/stig-manager.git
    cd stig-manager
    git checkout classic
    cd docker

### 3. Build the Apache image
    docker-compose build

### 4. Start the orchestration    

    docker-compose up -d && docker-compose logs -f

Verify the Oracle container is ready for STIG Manager Classic to initialize, which may take a few minutes. You will see a line like this in the log output when the database is ready:

    db_1 | Pluggable database ORCLPDB1 opened read write

Once you see this line, you can exit the log output by typing `Ctrl-C`.

### 5. Initialize STIG Manager Classic with demonstration data
*The initialization process has dependencies requiring you to run the orchestration on a Linux host. We will remove this dependency shortly.*

You will now run a script that will initialize and populate the STIG Manager Classic database with demonstration data and STIGs. **By default, data is not persisted when the Oracle container is destroyed.** If you wish to persist data, you must edit `docker-compose.yml` to mount a volume to `/ORCL` in the Oracle container.

    cd stigman-init
    ./stigman-init.sh

The initialization script will ask to perform the following functions:
- Create the STIG Manager Classic schemas
- Import demonstration data
- Download the current STIG Compilation Library from https://public.cyber.mil/stigs/compilations/ (over 360 STIGs)
- Download the current SCAP content from https://public.cyber.mil/stigs/scap/
- Import the STIG Compilation Library and SCAP content

If you want to provide your own collection of STIGS, they are available for [individual download](https://public.cyber.mil/stigs/downloads). The Zipped files should be placed in the `docker/stigman-init/stigs` directory before you run the script. Check out the `stigman-init` script for how to run the STIGs import manually in the future. Please note that importing the STIG Compilation Library can take quite a while (~30 mins).

### 6. Browse to `https://localhost:50443` and login

STIG Manager should be available at https://localhost:50443. The following demonstration users are available to login:

| User         | Password | Role         | Department | Can elevate |
|--------------|----------|--------------|------------|-------------|
| admin        | password | IA Staff     | 10         | Yes         |
| officer-10   | password | IA Officer   | 10         | No          |
| workforce-10 | password | IA Workforce | 10         | Yes         |
| officer-60   | password | IA Officer   | 60         | Yes         |
| workforce-60 | password | IA Workforce | 60         | Yes         |

Switching between users will help you understand how STIG Manager Classic supports the STIG assessment workflow using Group and Role based access control.

## STIG Manager Classic User Guide
We are revising our User Guide to remove sensitive screen shots and features. Please visit again very soon for updates.