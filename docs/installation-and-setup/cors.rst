.. _cors:


Cross-Origin Resource Sharing (CORS)
##########################################


The STIG Manager client needs to make requests to the Authentication Provider for its access token.  The Authentication Provider may have a different origin than the Client, so the Authentication Provider must be able to specify that this Cross-Origin request is allowed. It does this via the ``Access-Control-Allow-Origin`` response header. 

Some Authentication Providers, such as F5, are unable to set this header appropriately.  

In these situations, STIG Manager can act as a proxy for the openid-configuration and token endpoints of your Authentication Provider.  This will avoid triggering browsers CORS rules. 

To configure STIG Manager to do this, set the following client Environment Variable to the specified value:
``STIGMAN_CLIENT_OIDC_PROVIDER = "api/op/cors-proxy/oidc"``

STIG Manager Client requests to the openid-configuration and token endpoints will now go to the API, which then functions as a CORS proxy and forwards incoming requests to the OIDC Provider configured by STIGMAN_OIDC_PROVIDER.

This feature also includes optional Environment Variable STIGMAN_OIDC_PROXY_HOST. The specifies the ``Host:`` header value to be used by the CORS proxy for outbound requests. Some OIDC providers return configuration metadata with endpoint URLs having this value as their base.

.. note::
    This feature is considered experimental and may not be supported indefinitely.


