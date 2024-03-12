.. _db:


Database 
########################################


The STIGMan API was developed with a Controller-Service model that allows additional database services to be developed while using the same Controller code. However, the only database currently supported is MySQL.


Database User Requirements
-----------------------------------

The database user specified must have sufficient permissions on the specified schema to update and create tables. 
Specify the User and Schema with these environment variables:

    * ``STIGMAN_DB_SCHEMA``
    * ``STIGMAN_DB_USER``



.. _mySQL:


Database - MySQL 8.0.21+
-----------------------------

The STIG Manager API is tested with the latest 3 minor versions of the MySQL 8.0.x series, and 8.0.21.
While STIG Manager will bootstrap when provided with an 8.0.21+ MySQL database, it is strongly recommended you use the latest version of MySQL 8.0.x available.

The API requires knowledge of 1) the DB address/port, 2) which schema (database) is used for STIG Manager, and 3) User credentials with necessary privileges on that schema. `More information about MySQL. <https://dev.mysql.com/doc/>`_

.. note::
   The API includes a database migration function which tracks the database schema version and if necessary can automatically update the schema at launch. The initial run of the API scaffolds all database objects and static data.  Releases that require a database change will include a message in the release notes.


Configure MySQL
~~~~~~~~~~~~~~~~~~~~

STIG Manager requires a database schema, and the use of an account with SuperUser privileges on the intended schema:

  * Create schema - suggested value: stigman
  * Create user - suggested value: stigman
  * Grant User all privileges on created schema (``grant all on *stigman* schema to *stigman* user``). 

The above steps are sufficient for a username/password setup, but it is highly recommended that you configure MySQL to use TLS connections.

.. note::
   Suggested DB configuration options:
    - ``sort_buffer_size`` - set to at least 2M (2097152), and perhaps up to 64M (Increasing the sort_buffer_size from the default of 256k may only be required if you have very large detail/comment text fields).
    - ``innodb_buffer_pool_size`` -  set to at least 256M (268435456), and perhaps up to 2GB (2147483648)


Configure MySQL for TLS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Configure MySQL to use TLS by altering the ``/etc/mysql/conf.d/tls.cnf`` file, specifying the certificates it should use, and requiring TLS connections.

.. code-block::
  :caption: Sample Configuration

  [mysqld]
  ssl-ca=/etc/certs/ca.pem
  ssl-cert=/etc/certs/server-cert.pem
  ssl-key=/etc/certs/server-key.pem
  require_secure_transport=ON

Place the certificates in the locations specified in the .cnf file. This sample tls.cnf file can be found in our `sample orchestration repo on GitHub <https://github.com/NUWCDIVNPT/stig-manager-docker-compose/blob/main/tls/mysql/tls.cnf>`_.

The stigman API user must be altered in MySQL such that it is identified by the subject of the valid X.509 certificate it will use to connect. The following command, customized to suit your certificates, will accomplish this:
``ALTER USER stigman@'%' IDENTIFIED BY '' REQUIRE SUBJECT '/C=US/ST=California/L=Santa Clara/CN=fake-client';``

`A sample orchestration for STIG Manager configured with TLS is available. <https://github.com/NUWCDIVNPT/stig-manager-docker-compose>`_

`More information about configuring MySQL to use encrypted connections. <https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html>`_

Configure STIG Manager to use your MySQL Database
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Specify your MySQL DB with the following Environment Variables:

 * *STIGMAN_DB_HOST* - Default: localhost - The database hostname or IP from to the API server
 * *STIGMAN_DB_PORT* - Default: 50001 - The database TCP port relative to the API server
 * *STIGMAN_DB_USER* - Default: stigman - The user account used to login to the database
 * *STIGMAN_DB_SCHEMA* - Default: stigman - The schema where the STIG Manager object are found
 * *STIGMAN_DB_PASSWORD* - The database user password. Not required if configuring TLS connections, as shown below.

To enable TLS connections with your MySQL database, specify the following Environment Variables:

 * *STIGMAN_DB_TLS_CA_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database. 
 * *STIGMAN_DB_TLS_CERT_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client.
 * *STIGMAN_DB_TLS_KEY_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client.


`A sample orchestration for STIG Manager configured for TLS to MySQL is available. <https://github.com/NUWCDIVNPT/stig-manager-docker-compose>`_ This sample orchestration uses self-signed certificates and should be used for testing purposes only.