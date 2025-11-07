const MOCK_OIDC_URL = 'http://localhost:8080'

/**
 * Test user definitions these are generated and not correct.
 */
export const testUsers = {
  admin: {
    userId: 'admin-001',
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@stigman.test',
    privileges: ['admin', 'create_collection'],
  },
  collectionOwner: {
    userId: 'owner-001',
    username: 'collection-owner',
    displayName: 'Collection Owner',
    email: 'owner@stigman.test',
    privileges: ['create_collection'],
  },
  reviewer: {
    userId: 'reviewer-001',
    username: 'reviewer',
    displayName: 'Reviewer User',
    email: 'reviewer@stigman.test',
    privileges: ['create_collection'],
  },
  readOnly: {
    userId: 'readonly-001',
    username: 'readonly',
    displayName: 'Read Only User',
    email: 'readonly@stigman.test',
    privileges: [],
  },
}

/**
 * Get a JWT token from MockOidc server
 */
async function getToken(user) {
  // Use privileges directly from user object - no conversion needed
  const privileges = user.privileges

  const params = new URLSearchParams({
    username: user.username,
    scope: 'stig-manager',
    audience: 'stig-manager',
    expiresIn: '1h',
    algorithm: 'RS256',
  })

  // Add privileges as separate params (MockOidc expects multiple params for array)
  privileges.forEach(priv => params.append('privileges', priv))

  try {
    const response = await fetch(`${MOCK_OIDC_URL}/api/get-token?${params}`)
    if (!response.ok) {
      throw new Error(`MockOidc returned ${response.status}: ${await response.text()}`)
    }
    const data = await response.json()
    return { token: data.token, payload: data.tokenDecoded?.payload }
  }
  catch (error) {
    console.error('Failed to get token from MockOidc:', error)
    throw new Error(`Make sure MockOidc server is running at ${MOCK_OIDC_URL}. Error: ${error.message}`)
  }
}

/**
 * Setup authentication mocks for a page
 * This gets real JWT tokens from MockOidc and sets up the auth environment
 *
 * What's mocked:
 * - Env.js configuration
 * - OIDC worker (OAuth flow)
 * - localStorage pre-population (to skip login)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {object} user - User object from testUsers
 */
export async function setupAuthMocks(page, user) {
  if (!user) {
    throw new Error('setupAuthMocks requires a user object')
  }

  // Get a JWT token and decoded payload from MockOidc server
  const { token: mockToken, payload: mockPayload } = await getToken(user)

  // Set localStorage directly with auth tokens
  await page.addInitScript(({ token, payload }) => {
    localStorage.setItem('oidc.token', token)
    localStorage.setItem('oidc.tokenParsed', JSON.stringify(payload))
    localStorage.setItem('oidc.refreshToken', 'mock-refresh-token')
  }, { token: mockToken, payload: mockPayload })

  // Mock the Env.js that provides OAuth configuration and API base URL etc
  await page.route('**/js/Env.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.STIGMAN = window.STIGMAN || {};
        window.STIGMAN.Env = {
          apiBase: '/api',
          oauth: {
            authority: '${MOCK_OIDC_URL}',
            clientId: 'stig-manager',
            scope: 'openid stig-manager:collection stig-manager:stig:read',
          },
          version: '1.0.0-test'
        };
      `,
    })
  })

  // Mock the OIDC worker (SharedWorker) to return the real token
  await page.route('**/oidc-worker.js', async (route) => {
    // Get real token from MockOidc for this specific request
    const { token: realToken, payload: tokenPayload } = await getToken(user)

    //  Respond with a mocked OIDC worker script that always returns the token
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        // Mock SharedWorker for OIDC testing with real JWT token
        console.log('[Test] OIDC Worker mocked for user: ${user.username}');
        
        const bcName = 'stigman-oidc-worker';
        const bc = new BroadcastChannel(bcName);

        onconnect = function(e) {
          const port = e.ports[0];
          
          port.onmessage = async function(event) {
            const { requestId, request } = event.data;
            
            if (request === 'initialize') {
              port.postMessage({
                requestId,
                response: { initialized: true }
              });
              
              bc.postMessage({
                type: 'accessToken',
                accessToken: '${realToken}',
                accessTokenPayload: ${JSON.stringify(tokenPayload)}
              });
            } 
            else if (request === 'getAccessToken') {
              port.postMessage({
                requestId,
                response: {
                  accessToken: '${realToken}',
                  accessTokenPayload: ${JSON.stringify(tokenPayload)}
                }
              });
            }
            else if (request === 'exchangeCodeForToken') {
              port.postMessage({
                requestId,
                response: {
                  success: true,
                  accessToken: '${realToken}',
                  accessTokenPayload: ${JSON.stringify(tokenPayload)}
                }
              });
            }
            else if (request === 'logout') {
              port.postMessage({
                requestId,
                response: {
                  success: true,
                  redirect: '/'
                }
              });
            }
          };
          
          port.start();
        };
      `,
    })
  })
}

/**
 * Get current user from localStorage
 */
export async function getCurrentUser(page) {
  return await page.evaluate(() => {
    const tokenParsed = localStorage.getItem('oidc.tokenParsed')
    return tokenParsed ? JSON.parse(tokenParsed) : null
  })
}

/**
 * Logout current user
 */
export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('oidc.token')
    localStorage.removeItem('oidc.tokenParsed')
    localStorage.removeItem('oidc.refreshToken')
  })
  await page.reload()
}
