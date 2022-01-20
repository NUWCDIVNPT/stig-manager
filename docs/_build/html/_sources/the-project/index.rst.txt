
.. _the-project:

The STIG Manager Project
#####################################



.. meta::
  :description: Information about the STIG Manager project itself.

These pages describe the STIG Manager project.

.. note:
   This section is still under development.


.. toctree::
	:maxdepth: 1
	:caption: Contents:

	contributing
	testing
	documentation
	examples
	requirements-and-dependencies
	clients
	related-repos
	DockerHub_Readme.md


STIG Manager is an active, Open Source project maintained by NUWCDIVNPT
========================================================================

STIG Manager is actively under development. Get the latest info here: `STIG Manager <https://github.com/NUWCDIVNPT/stig-manager/>`_


STIG Manager is participating in the `Code.mil Open Source initiative <https://code.mil/>`_.

The STIG Manager project is chiefly composed of the STIG Manager API and the STIG Manager Client. `The STIG Manager API provides a well-defined programmatic interface for engaging with the resources and data it maintains. <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_ The STIG Manager Client is just one use of the API that this architecture enables. In a modern, open source microservice-oriented ecosystem, other developers will be able to contribute new utilities and services that will expand functionality. User Stories, Feature Requests, Bugs, and Issues will be tracked in GitHub to help determine future efforts. 


STIG Manager Operations
----------------------------------

STIG Manager is a modern, containerized application built to take full advantage of a CI/CD DevOps pipeline. Updates to STIG Manager will trigger automatic testing and image creation. Organizations will have the option to engage with the pipeline to automatically deploy new versions to their test environments, or directly to production.




|

