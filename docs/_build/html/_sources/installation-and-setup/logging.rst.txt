.. _logging:


Logging 
########################################


STIG Manager writes all log entries to STDOUT. Use the ``docker logs`` or equivalent container engine command to view them.


How you capture and persist these log entries will depend on your Organizational requirements. 



.. rubric:: Log format

HTTP transactions handled by the API are logged to STDOUT following the Apache Common Log Format. Fields are in this order:

``:remote-addr :forwarded-for :token-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]``

At startup log entries may be preceded by labels such ``[AUTH]`` or ``[DB]`` indicating the portion of the API that is attempting to establish itself. 


.. note::
    The logging conventions currently implemented are candidates for future development. 

