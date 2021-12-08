.. _logging:


Logging 
########################################


STIG Manager writes all log entries to STDOUT.  How you capture and persist these log entries will depend on your Organizational requirements. 


.. rubric:: Log format

The API implements a structured logging format in JSON, and supports several logging levels and modes.


Log entries will conform to the following JSON schema:

.. code-block:: yaml

    type: object
    properties:
        date:
            type: string
        level:
            type: integer
        component:
            type: string
        type:
            type: string
        data:
            type: object
    required:
    - date
    - level
    - component
    - type
    - data



The ``data`` object is extensible and will contain structured details concerning the event. 

The contents of the logs can be controlled with the following :ref:`Environment Variables`: 

STIGMAN_LOG_LEVEL
    - Default: ``3``
    - Controls the granularity of the generated log output, from 1 to 4. Each level is inclusive of the ones before it. Level 1 will log only errors, level 2 includes warnings, level 3 includes status and transaction logs, and level 4 includes debug-level logs. 

STIGMAN_LOG_MODE
    - Default: ``combined``
    - Controls whether the API will create one "combined" log entry for http requests that includes both the request and response information; or two separate log entries, one for the request and one for the response, that can be correlated via a generated Request GUID in each entry.  Any value other than "combined" will produce separate log entries. 


