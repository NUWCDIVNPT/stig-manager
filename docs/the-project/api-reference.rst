
.. _api-reference:

API Reference
########################

.. meta::
  :description: A browseable reference for the STIG Manager API.


The STIG Manager API is defined by an `OpenAPI 3.0 specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_, which is the authoritative contract for the API.

A browseable presentation of the specification is available here:

`Open the API Reference Browser <../api-reference/index.html>`_

The browser presents every endpoint with its method, path, and ``operationId``, along with request parameters, response schemas, and generated code samples. It is rendered by `Scalar <https://github.com/scalar/scalar>`_ from the same specification file used to build this documentation, so it always matches the documented release.

Requests can be tested against a running API deployment from the browser. To authorize:

#. In the Authentication panel, set the discovery URL to your OIDC provider's well-known configuration endpoint and click **Fetch Configuration**.
#. Select the ``authorizationCode`` flow. 
#. Enter your Client ID (``stig-manager`` in a default deployment) and click **Authorize**.

When sending a request from the test client, make sure ``authorizationCode`` is selected.

The specification file itself, as built with this documentation, can be downloaded here: `stig-manager.yaml <../api-reference/stig-manager.yaml>`_


Log Stream WebSocket API
=========================

The API also provides a WebSocket endpoint for streaming log messages in real time, defined by an `AsyncAPI 3.0 specification <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/log-socket.yaml>`_. A browseable presentation is available here:

`Open the Log Stream API Reference Browser <../api-reference/log-socket.html>`_

The specification file can be downloaded here: `log-socket.yaml <../api-reference/log-socket.yaml>`_

|
