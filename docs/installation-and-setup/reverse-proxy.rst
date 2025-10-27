.. _reverse-proxy:


Deploy with TLS 
########################################



Configure a Reverse Proxy or Kubernetes Ingress Controller
--------------------------------------------------------------

To support HTTPS connections, STIG Manager components should be situated behind a reverse proxy or in a Kubernetes cluster.  Configure the reverse proxy (such as nginx) or the Kubernetes Ingress Controller in accordance with publisher documentation, local security requirements, and OIDC Provider (eg. Keycloak) documentation.

**Keycloak Configuration for Reverse Proxy Environments:**

- **Keycloak 26+**: Set ``KC_PROXY_HEADERS=xforwarded`` and ``KC_HTTP_ENABLED=true`` (if TLS terminates at proxy)
- Ensure your proxy forwards appropriate headers (X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host)



STIG Manager with nginx for TLS and CAC Authentication
-------------------------------------------------------------------

The STIG Manager OSS team provides a repository on GitHub with a sample nginx deployment, with a configuration file that may be useful to those setting up a Production deployment:


https://github.com/NUWCDIVNPT/stigman-orchestration


------------------------------------------

.. thumbnail:: /assets/images/component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Reverse Proxy

---------------------------

.. thumbnail:: /assets/images/k8-component-diagram.svg
  :width: 50%
  :show_caption: True 
  :title: Component Diagram with Kubernetes



Proxy Configuration for Streaming, SSE and WebSocket Endpoints
############################################################

.. important::

   STIG Manager uses streaming responses, Server-Sent Events (SSE), and WebSocket connections for real-time operations. These require specific proxy configuration to function properly.

Proxy Requirements
--------------------------------------------------------------

For proper operation of streaming, SSE, and WebSocket endpoints, your proxy must:

1. **Disable response buffering** for streaming endpoints
2. **Pass through streaming headers** without modification
3. **Maintain persistent connections** for SSE and WebSocket endpoints
4. **Support HTTP connection upgrade** for WebSocket endpoints

The application automatically sets the ``x-accel-buffering: no`` header which nginx (and Azure Application Gateway) honors by default to disable buffering. Other proxies may require explicit configuration.

.. warning::

   If your proxy is configured to:

   - Override or ignore response headers
   - Force buffering on all responses
   - Have aggressive timeout settings for long-lived connections

   You MUST adjust your proxy configuration to exempt the endpoints listed below.

Essential Streaming Endpoints
--------------------------------------------------------------

The following endpoints require unbuffered, real-time response streaming:

**Streaming Responses (NDJSON):**

  - ``POST /collections/{collectionId}/export-to/{dstCollectionId}``

    - Content-Type: ``application/x-ndjson``
    - Operation: Collection export with progress updates
    - API operationId: ``exportToCollection``

  - ``POST /collections/{collectionId}/clone``

    - Content-Type: ``application/x-ndjson``
    - Operation: Collection cloning with progress updates
    - API operationId: ``cloneCollection``

**Server-Sent Events (SSE):**

  - ``GET /op/state/sse``

    - Content-Type: ``text/event-stream``
    - Operation: Real-time operation state updates
    - API operationId: ``streamStateSse``

**WebSocket Connection:**

  - ``GET <origin>/socket/log-socket``

    - Requires HTTP connection upgrade to WebSocket protocol
    - Operation: Real-time log streaming over WebSocket

Proxy-Specific Configuration Examples
--------------------------------------------------------------

While specific configuration varies by proxy, here are the key settings to verify:

**nginx:**
  - Honors ``x-accel-buffering: no`` header automatically (no configuration needed)
  - Ensure ``proxy_buffering`` is not forced to ``on`` globally
  - Consider setting ``proxy_read_timeout`` appropriately for SSE connections

**Apache (mod_proxy_http):**
  - Basic ``ProxyPass`` with HTTP backends typically works for SSE
  - Use ``ProxyPreserveHost On`` for proper host header forwarding
  - If issues occur, may need to adjust Keep-Alive or timeout settings for SSE endpoints

**HAProxy:**
  - Typically works without modification
  - Verify ``timeout server`` and ``timeout client`` for long connections

**Other Proxies:**
  - Most modern proxies automatically detect and handle SSE (Content-Type: text/event-stream)
  - Consult proxy documentation for buffering and timeout configuration if issues occur

Verifying Proper Configuration
--------------------------------------------------------------

**Test SSE Endpoint:**

After deployment, test the SSE endpoint to verify proper streaming::

  curl -N http://<api-url>/op/state/sse

Or open in a browser::

  http://<api-url>/op/state/sse

**Expected behavior:**
  - Immediate initial response (within 1-2 seconds)
  - Periodic keepalive events every 30 seconds
  - No long delay before first response

**If issues occur:**
  - Long delay before any response → Proxy is buffering
  - Connection drops after timeout → Timeout settings too aggressive
  - No events received → Headers being stripped or modified

Troubleshooting Option
------------------------------

If you experience persistent buffering issues that cannot be resolved through proxy configuration, STIG Manager provides an environment variable to temporarily disable SSE functionality:
  ``STIGMAN_CLIENT_STATE_EVENTS=false``
This disables the web client's SSE listening for API state events. This should only be used temporarily while resolving proxy buffering issues, as it disables real-time operation monitoring.

Future Considerations
------------------------------

.. note::

   Future STIG Manager features will utilize WebSocket connections. When implementing, ensure your proxy supports:

   - HTTP connection upgrade to WebSocket protocol
   - Long-lived WebSocket connections
   - Appropriate timeout configurations for persistent connections







