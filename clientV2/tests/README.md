# E2E Testing: Real API with Mocked Auth

Complete E2E testing setup that tests against your **real API** with **mocked authentication**.

## 🎯 What This Is

- ✅ **Mocked Auth** - No Keycloak needed, fast OAuth mocking
- ✅ **Real API** - Test against actual backend, real data, real permissions
- ✅ **Fast & Reliable** - No external auth dependencies
- ✅ **Realistic** - API responses and permission enforcement are real

## 🚀 Quick Start

See **[QUICK-START-REAL-API.md](./QUICK-START-REAL-API.md)** for the fastest way to get started.

For complete documentation, see **[REAL-API-GUIDE.md](./REAL-API-GUIDE.md)**.

### 1. Start Your API

```bash
cd /path/to/api
npm start  # API should be running on http://localhost:64001
```

### 2. Run Example Tests

```bash
npm run playwright -- real-api-example.test.js
```

## 🎭 Test Users

Pre-configured test users (no Keycloak setup needed):

| User | Username | Roles | Permissions |
|------|----------|-------|-------------|
| Admin | `admin` | admin, user | Full access, all permissions |
| Collection Owner | `collection-owner` | user | Can modify collections 1 & 2 |
| Reviewer | `reviewer` | user | Can modify collection 1 |
| Read Only | `readonly` | user | Read-only access to collection 1 |

## 📝 Writing Tests

### Basic Test

```javascript
import { expect, test } from './fixtures-real-api.js'

test('admin can view collections', async ({ page }) => {
  // Auth automatically mocked as admin
  await page.goto('/')
  await page.waitForTimeout(2000)

  // API calls go to real backend
  await expect(page.locator('#app')).toContainText('Collections')
})
```

### Switch Users

```javascript
test('test different permissions', async ({ page, loginAs }) => {
  await page.goto('/')

  // Test as admin
  await loginAs('admin')
  await expect(page.getByText('Admin User')).toBeVisible()

  // Test as read-only
  await loginAs('readOnly')
  // API enforces read-only permissions
})
```

## 🧪 Running Tests

```bash
# Run all E2E tests
npm run playwright

# Run specific test
npm run playwright -- real-api-example.test.js

# Run with browser visible
npm run playwright:headed

# Debug mode
npm run playwright -- --debug real-api-example.test.js
```

## 📁 Files

```
tests/e2e/
├── auth-real-api.helpers.js     # Auth mocking + test users
├── fixtures-real-api.js         # Playwright fixtures (loginAs, etc)
├── real-api-example.test.js     # Example tests
├── auth-real-api.setup.js       # Optional global setup
├── QUICK-START-REAL-API.md      # Fast setup guide
├── REAL-API-GUIDE.md            # Complete documentation
└── README.md                    # This file
```

## 🔧 How It Works

```
E2E Test
  ├─> Mocked OIDC Worker (creates JWT tokens)
  ├─> Mocked State Worker (API health check)
  └─> Real API Calls
      └─> API receives mock JWT
      └─> API validates token structure
      └─> API returns real data from database
```

Your API receives mocked JWT tokens but returns real data. The API extracts user info (roles, permissions) from the token and enforces real authorization.

## ⚙️ API Configuration

Your API needs to accept test tokens. Add this to your auth middleware:

```javascript
if (process.env.NODE_ENV === 'test') {
  // Skip JWT signature verification in test mode
  const payload = jwt.decode(token)
  req.user = payload
}
else {
  // Normal Keycloak verification
  const payload = jwt.verify(token, keycloakPublicKey)
  req.user = payload
}
```

## 🐛 Troubleshooting

**401 Errors?**
- API is rejecting mock tokens
- Configure API to skip signature verification in test mode

**Tests time out?**
- Check if API is running: `curl http://localhost:64001/api/collections`
- API might be trying to validate with Keycloak

**App not loading?**
- Check browser console for `[Test] OIDC Worker mocked`
- Verify `oidc.token` exists in localStorage

## 📚 Documentation

- **[QUICK-START-REAL-API.md](./QUICK-START-REAL-API.md)** - Get started in 3 steps
- **[REAL-API-GUIDE.md](./REAL-API-GUIDE.md)** - Complete guide with examples

## 🎯 Benefits

| Feature | Status |
|---------|--------|
| Setup Keycloak? | ❌ Not needed |
| Setup test users in Keycloak? | ❌ Not needed |
| Run real API? | ✅ Yes |
| Get real data? | ✅ Yes |
| Test real permissions? | ✅ Yes |
| Fast tests? | ✅ Yes (~2-3s) |
| CI/CD friendly? | ✅ Yes (just needs API) |

🎉 **Simple, fast, and realistic testing!**

## 🎭 Test Users

Pre-configured test users with different roles and permissions:

### Admin User
```javascript
await loginAs('admin')
```
- **Username**: admin
- **Roles**: admin, user
- **Permissions**: Full system access, can manage users, create collections, manage STIGs

### Collection Owner
```javascript
await loginAs('collectionOwner')
```
- **Username**: collectionowner
- **Roles**: owner, user
- **Permissions**: Can manage collections 1 & 2, cannot manage users

### Reviewer
```javascript
await loginAs('reviewer')
```
- **Username**: reviewer
- **Roles**: reviewer, user
- **Permissions**: Can review in collection 1 only

### Read Only User
```javascript
await loginAs('readOnly')
```
- **Username**: readonly
- **Roles**: user
- **Permissions**: View-only access to collection 1

### Restricted User
```javascript
await loginAs('restricted')
```
- **Username**: restricted
- **Roles**: restricted, user
- **Permissions**: No collection access

## 🚀 Quick Start

### Basic Test with Authentication

```javascript
import { expect, test } from './fixtures.js'

test('my test', async ({ page, loginAs }) => {
  await page.goto('/')
  await loginAs('admin') // Login as admin user

  // Your test code here...
  await expect(page.getByText('Collections')).toBeVisible()
})
```

### Test Multiple Roles

```javascript
test('feature works for different roles', async ({ page, loginAs }) => {
  await page.goto('/')

  // Test as admin
  await loginAs('admin')
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible()

  // Test as read-only user
  await loginAs('readOnly')
  await expect(page.getByRole('button', { name: 'Create' })).not.toBeVisible()
})
```

### Switch Users Mid-Test

```javascript
test('permission changes are immediate', async ({ page, loginAs, switchUser }) => {
  await page.goto('/')
  await loginAs('admin')

  // Do something as admin
  await page.click('text=Settings')

  // Switch to reviewer
  await switchUser('reviewer')

  // Verify reviewer doesn't see settings
  await expect(page.getByText('Settings')).not.toBeVisible()
})
```

### Get Current User Info

```javascript
test('verify user context', async ({ page, loginAs, getCurrentUser }) => {
  await page.goto('/')
  await loginAs('collectionOwner')

  const user = await getCurrentUser()
  expect(user.username).toBe('collectionowner')
  expect(user.roles).toContain('owner')
  expect(user.privileges.collections).toEqual(['1', '2'])
})
```

## 📦 API Mocking with Playwright

API mocking is handled using Playwright's built-in `page.route()` functionality.
Your existing MSW handlers (from feature mocks) are referenced in `api-mocking.helpers.js`.

### Current Setup

The E2E tests use:
- Playwright's `page.route()` for API mocking in E2E tests
- Your existing MSW handlers are in `src/features/*/mocks/*.handler.js` (for unit tests)
- Helper functions in `tests/e2e/api-mocking.helpers.js`

### Adding Custom Mock Handlers

Edit `tests/e2e/api-mocking.helpers.js`:

```javascript
export const e2eApiResponses = {
  '/api/my-endpoint': { data: 'test data' },
}
```

Or mock directly in your test using Playwright:

```javascript
test('my test', async ({ page }) => {
  await page.route('**/api/my-endpoint', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ data: 'test' })
    })
  })
})
```### Using API Mocking in Tests

API mocking happens automatically via Playwright's route interception.

```javascript
test('api integration', async ({ page, loginAs }) => {
  await page.goto('/')
  await loginAs('admin')

  // Mock API endpoint
  await page.route('**/api/collections', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        { collectionId: '1', name: 'Collection1' },
        { collectionId: '2', name: 'Collection2' },
      ])
    })
  })

  // Click something that makes an API call
  await page.click('text=Load Collections')

  // Playwright intercepts the request and returns mock data
  await expect(page.getByText('Collection1')).toBeVisible()
})
```

## 🧪 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test advanced.test.js

# Run with browser visible
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test by name
npx playwright test -g "admin user has full access"

# Run tests and show console logs
npx playwright test --workers=1
```

## 📁 Files Structure

```
tests/e2e/
├── auth.setup.js           # Authentication setup (runs before tests)
├── fixtures.js             # Custom fixtures (loginAs, switchUser, etc.)
├── api-mocking.helpers.js  # API mocking helpers for Playwright
├── smoke.test.js           # Basic smoke tests
├── advanced.test.js        # Role-based authentication tests
├── api-mocking.test.js     # API mocking examples
├── QUICKREF.md            # Quick reference guide
└── README.md              # This file
```

## 🔧 How It Works

1. **Setup Phase** (`auth.setup.js`)
   - Mocks OAuth/OIDC worker
   - Creates authenticated session with default admin user
   - Saves session state to `playwright/.auth/user.json`

2. **Test Phase**
   - Tests load with admin user by default
   - Use `loginAs(user)` to switch to different users
   - Use Playwright's `page.route()` to mock API calls
   - Your existing MSW handlers provide reference data structures

3. **User Switching**
   - Changes localStorage token
   - Reloads page to apply new auth state
   - App sees new user instantly

## 🎯 Best Practices

### 1. Test with Appropriate Users

```javascript
// Good - test with the minimum required permissions
test('user can view collection', async ({ page, loginAs }) => {
  await loginAs('readOnly') // Not admin!
  // test viewing...
})

// Bad - using admin for everything
test('user can view collection', async ({ page, loginAs }) => {
  await loginAs('admin') // Too much permission!
  // test viewing...
})
```

### 2. Test Permission Boundaries

```javascript
test('collection owner cannot manage users', async ({ page, loginAs }) => {
  await loginAs('collectionOwner')
  await page.goto('/users')

  // Should be blocked or redirected
  await expect(page.getByText('Access Denied')).toBeVisible()
})
```

### 3. Use Descriptive Test Names

```javascript
// Good
test('admin can create new collection with metadata', async ({ ... }) => {})

// Bad
test('test collections', async ({ ... }) => {})
```

## 🐛 Troubleshooting

### Tests fail with "User not authenticated"

Check if auth setup completed successfully:
```bash
# Should see: "✓ Authentication setup complete (logged in as: admin)"
npx playwright test --reporter=list
```

### MSW not intercepting requests

1. Check `api-mocking.helpers.js` has the correct handlers
2. Use Playwright's `page.route()` for E2E tests instead of MSW
3. MSW is for unit/component tests - E2E uses Playwright routing
4. Check browser console in headed mode:
   ```bash
   npx playwright test --headed
   ```

### Need to see what user is logged in

```javascript
test.only('debug user', async ({ page, getCurrentUser }) => {
  await page.goto('/')
  const user = await getCurrentUser()
  console.log('Current user:', JSON.stringify(user, null, 2))
})
```

## 🔐 Custom Test Users

To add your own test user, edit `tests/e2e/fixtures.js`:

```javascript
export const testUsers = {
  // ... existing users

  myCustomUser: {
    userId: 'custom-001',
    username: 'customuser',
    displayName: 'Custom User',
    email: 'custom@test.com',
    roles: ['custom-role'],
    privileges: {
      globalAccess: false,
      canCreateCollections: false,
      canManageUsers: false,
      canManageSTIGs: false,
      collections: ['1'],
    },
  },
}
```

Then use it in tests:
```javascript
await loginAs('myCustomUser')
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [MSW Documentation](https://mswjs.io)
- [Testing Library Best Practices](https://testing-library.com/docs/)
