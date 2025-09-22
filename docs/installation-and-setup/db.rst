.. _db:


Database 
########################################


The STIGMan API was developed with a Controller-Service model that allows additional database services to be developed while using the same Controller code. However, the only database currently supported is MySQL.


Database Requirements
-----------------------------------

The STIG Manager API requires a dedicated MySQL database (equivalent to a schema in other RDBMS products). The API connects to MySQL with an account that must have a full grant to the dedicated database but does not require server administration privileges. On first bootstrap, all database tables, views, and static data will be created.


.. _mySQL:


Database - MySQL Latest 8.x
-----------------------------

The STIG Manager API is tested with the latest 2 minor versions of the MySQL 8.0.x and 8.4.x series, and 8.0.24.
While STIG Manager will bootstrap when provided with an 8.0.24+ MySQL database, it is strongly recommended you use the latest version of MySQL 8.4.x available.

The API requires knowledge of 1) the DB address/port, 2) which schema (database) is used for STIG Manager, and 3) User credentials with necessary privileges on that schema. `More information about MySQL. <https://dev.mysql.com/doc/>`_

.. note::
   The API includes a database migration function which tracks the database schema version and if necessary can automatically update the schema at launch. The initial run of the API scaffolds all database objects and static data.  Releases that require a database change will include a message in the release notes.


Configure MySQL
~~~~~~~~~~~~~~~~~~~~

Example commands to prepare MySQL for initial API execution:

  * Create database: ``CREATE DATABASE stigman``
  * Create API user account - ``CREATE USER 'stigman'@'%' IDENTIFIED BY 'new_password'``
  * Grant API user account all privileges on created database ``GRANT ALL ON stigman.* TO 'stigman'`` 

.. note::
   Important DB configuration options:
    - ``innodb_buffer_pool_size`` -  set to at least 8GB (8589934592) unless planning to manage a deployment with a very small amount of Assets and Reviews, and 16GB (17179869184) or more for larger deployments (>10,000 Assets).
    - ``sort_buffer_size`` - set to 16M (16777216).



Configure STIG Manager to use your MySQL Database and User
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Specify your MySQL DB and User information with the following Environment Variables:

 * *STIGMAN_DB_HOST* - Default: localhost - The database hostname or IP from to the API server
 * *STIGMAN_DB_PORT* - Default: 3306 - The database TCP port relative to the API server
 * *STIGMAN_DB_USER* - Default: stigman - The user account used to login to the database
 * *STIGMAN_DB_SCHEMA* - Default: stigman - The schema where the STIG Manager object are found
 * *STIGMAN_DB_PASSWORD* - The database user password. Not required if configuring client certificate connection, as shown below.


Additional MySQL Connection Configuration Options
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

TLS Connection
+++++++++++++++++++

Configure MySQL to use TLS by altering the ``/etc/mysql/conf.d/tls.cnf`` file, specifying the certificates it should use, and requiring TLS connections.

.. code-block::
  :caption: Sample Configuration

  [mysqld]
  ssl-ca=/etc/certs/ca.pem
  ssl-cert=/etc/certs/server-cert.pem
  ssl-key=/etc/certs/server-key.pem
  require_secure_transport=ON

Place the certificates in the locations specified in the .cnf file. This sample tls.cnf file can be found in our `sample orchestration repo on GitHub <https://github.com/NUWCDIVNPT/stig-manager-docker-compose/blob/main/tls/mysql/tls.cnf>`_.

The STIG Manager API must be configured to establish TLS connections to the MySQL database. The following environment variable must be set:

  * ``STIGMAN_DB_TLS_CA_FILE`` - A file/path relative to the API /tls directory that contains the PEM encoded CA certificate used to sign the database TLS certificate. Setting this variable enables TLS connections to the database. 

.. note::
   If using the STIG Manager API container, the CA certificate file must be mounted to the container at the path specified in the environment variable. (usually `/home/node/tls/<your-ca>.pem`)


Authenticate with Client Certificate
++++++++++++++++++++++++++++++++++++++

To authenticate to MySQL with a client certificate, the following environment variables must be set:

  * *STIGMAN_DB_TLS_CERT_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client certificate used when authenticating the database client.
  * *STIGMAN_DB_TLS_KEY_FILE* - A file/path relative to the API /tls directory that contains the PEM encoded Client private key used when authenticating the database client.

.. note::
   If using the STIG Manager API container, the client certificate and key files must be mounted to the container at the path specified in the environment variable. (usually `/home/node/tls/<your-client-cert/key>.pem`)

The stigman API user must be altered in MySQL such that it is identified by the subject of the valid X.509 certificate it will use to authenticate. The following command, customized to suit your certificates, will accomplish this:
``ALTER USER stigman@'%' IDENTIFIED BY '' REQUIRE SUBJECT '/C=US/ST=California/L=Santa Clara/CN=fake-client';``


`A sample orchestration for STIG Manager configured for TLS to MySQL is available. <https://github.com/NUWCDIVNPT/stig-manager-docker-compose>`_ This sample orchestration uses self-signed certificates and should be used for testing purposes only.

`More information about configuring MySQL to use encrypted connections. <https://dev.mysql.com/doc/refman/8.0/en/using-encrypted-connections.html>`_




