.. _logging:


Logging 
########################################


STIG Manager streams structured JSON logging objects to standard output (STDOUT). 
You should capture and persist these logging objects in accordance with your Organizational requirements. 


Logging schemas
---------------

The full JSON Schema (Draft 07) definition of our logging objects is available here. This documentation is organized to describe each 
logging component separately and presents the relevant sub-schemas.

Common
------

.. tabs::

  .. code-tab:: json

    {
      "$schema": "https://json-schema.org/draft-07/schema",
      "$id": "http://yourdomain.com/schemas/myschema.json",
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "format": "date-time"
        },
        "level": {
          "type": "integer",
          "minimum": 1,
          "maximum": 4
        },
        "component": {
          "type": "string",
          "enum": [
            "index",
            "initData",
            "oidc",
            "mysql",
            "static",
            "rest",
            "logger"
          ]
        },
        "type": {
          "type": "string"
        },
        "data": {
          "type": "object"
        }
      },
      "required": [
        "date",
        "level",
        "component",
        "type",
        "data"
      ],
      "additionalProperties": false
    }

  .. code-tab:: yaml

    "$schema": https://json-schema.org/draft-07/schema
    "$id": http://yourdomain.com/schemas/myschema.json
    type: object
    properties:
      date:
        type: string
        format: date-time
      level:
        type: integer
        minimum: 1
        maximum: 4
      component:
        type: string
        enum:
        - index
        - initData
        - oidc
        - mysql
        - static
        - rest
        - logger
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
    additionalProperties: false




The ``data`` object is extensible and will contain structured details concerning the event. 

The contents of the logs can be controlled with the following :ref:`Environment Variables`: 

STIGMAN_LOG_LEVEL
    - Default: ``3``
    - Controls the granularity of the generated log output, from 1 to 4. Each level is inclusive of the ones before it. Level 1 will log only errors, level 2 includes warnings, level 3 includes status and transaction logs, and level 4 includes debug-level logs. 

STIGMAN_LOG_MODE
    - Default: ``combined``
    - Controls whether the API will create one "combined" log entry for http requests that includes both the request and response information; or two separate log entries, one for the request and one for the response, that can be correlated via a generated Request GUID in each entry.  Any value other than "combined" will produce separate log entries. 


