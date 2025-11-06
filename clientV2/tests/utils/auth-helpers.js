/**
 * Real API Testing with MockOidc Auth
 *
 * This module provides authentication helpers for E2E tests that:
 * - Use MockOidc server to generate real, properly signed JWT tokens
 * - Test against real API endpoints (real data, real permissions)
 *
 * Best of both worlds: Real JWT tokens + Real API testing
 */

/**
 * MockOidc server base URL
 * Make sure the MockOidc server is running before tests
 */
const MOCK_OIDC_URL = 'http://localhost:8080'

/**
 * Test user definitions with roles and permissions
 * These users will be used to generate real JWT tokens from MockOidc
 */
export const testUsers = {
  admin: {
    userId: 'admin-001',
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@stigman.test',
    roles: ['admin'], // Will be converted to ['admin', 'create_collection'] for token
    privileges: {
      globalAccess: true,
      canCreateCollections: true,
      canManageUsers: true,
      canManageSTIGs: true,
    },
  },
  collectionOwner: {
    userId: 'owner-001',
    username: 'collection-owner',
    displayName: 'Collection Owner',
    email: 'owner@stigman.test',
    roles: ['user'], // Will be converted to ['create_collection'] for token
    privileges: {
      globalAccess: false,
      canCreateCollections: false,
      canManageUsers: false,
      canManageSTIGs: false,
    },
    permissions: {
      collectionIds: ['1', '2'],
      canModify: true,
    },
  },
  reviewer: {
    userId: 'reviewer-001',
    username: 'reviewer',
    displayName: 'Reviewer User',
    email: 'reviewer@stigman.test',
    roles: ['user'], // Will be converted to ['create_collection'] for token
    privileges: {
      globalAccess: false,
      canCreateCollections: false,
      canManageUsers: false,
      canManageSTIGs: false,
    },
    permissions: {
      collectionIds: ['1'],
      canModify: true,
    },
  },
  readOnly: {
    userId: 'readonly-001',
    username: 'readonly',
    displayName: 'Read Only User',
    email: 'readonly@stigman.test',
    roles: ['user'], // Will be converted to ['create_collection'] for token
    privileges: {
      globalAccess: false,
      canCreateCollections: false,
      canManageUsers: false,
      canManageSTIGs: false,
    },
    permissions: {
      collectionIds: ['1'],
      canModify: false,
    },
  },
}

/**
 * Create JWT token payload for a test user
 */
function createTokenPayload(user) {
  const now = Math.floor(Date.now() / 1000)
  const privileges = user.roles.includes('admin')
    ? ['admin', 'create_collection']
    : ['create_collection']

  return {
    sub: user.userId,
    name: user.displayName,
    preferred_username: user.username,
    email: user.email,
    realm_access: {
      roles: privileges, // Use computed privileges, not user.roles
    },
    scope: 'stig-manager', // Single scope string as expected by API
    aud: 'stig-manager', // Required by API
    exp: now + 3600, // 1 hour from now
    iat: now,
    iss: MOCK_OIDC_URL,
  }
}

/**
 * Get a real JWT token from MockOidc server
 */
async function getRealToken(user) {
  // Convert roles to privileges array format that API expects
  // e.g., ['admin', 'user'] becomes ['admin', 'create_collection']
  const privileges = user.roles.includes('admin')
    ? ['admin', 'create_collection']
    : ['create_collection']

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
    console.log('[Auth] Token generated for user:', user.username, 'with privileges:', privileges)
    return data.token
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
 * What's NOT mocked (uses real implementation):
 * - JWT tokens (real tokens from MockOidc server)
 * - API endpoints (all backend calls hit real API)
 * - state-worker.js (real API health monitoring via SSE)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {object} user - User object from testUsers
 */
export async function setupAuthMocks(page, user) {
  if (!user) {
    throw new Error('setupAuthMocks requires a user object')
  }

  // Get a real JWT token from MockOidc server
  const mockToken = await getRealToken(user)
  const mockPayload = createTokenPayload(user)

  // Set localStorage directly with auth tokens
  await page.addInitScript(({ token, payload }) => {
    localStorage.setItem('oidc.token', token)
    localStorage.setItem('oidc.tokenParsed', JSON.stringify(payload))
    localStorage.setItem('oidc.refreshToken', 'mock-refresh-token')
  }, { token: mockToken, payload: mockPayload })

  // Mock the Env.js that provides OAuth configuration
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
    const realToken = await getRealToken(user)
    const tokenPayload = createTokenPayload(user)

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

  // Note: state-worker.js is NOT mocked - uses real API state monitoring
  // This allows testing real API health, SSE events, and state changes

  // Note: API endpoints are NOT mocked - they hit the real API
  // This allows testing real API responses and permissions
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
