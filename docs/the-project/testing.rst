.. _testing:


API Testing Guide
########################################


The STIG Manager project currently tests its API using a Mocha/Chai/Chai-HTTP and specific test data, which can be found in the repo.

The tests are run automatically with Mocha via github actions whenever a Pull Request is made to the project.

The tests focus on proper functioning of the API, and verification that appropriate data is returned to Users.
The tests run in several iterations, simulating Users accessing the system with varying privileges, Grants, Roles and ACLs, and checks that they can only receive and alter appropriate data.



Running the API Tests Locally
=============================================

See the test `README.md <https://github.com/NUWCDIVNPT/stig-manager/tree/main/test/api/README.md>`_ for more information on running the tests and test data.