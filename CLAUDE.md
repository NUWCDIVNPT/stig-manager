# CLAUDE.md - AI Assistant Guide for STIG Manager

> **Last Updated:** 2025-11-16
> **Version:** 1.5.15
> **Purpose:** Comprehensive guide for AI assistants working with the STIG Manager codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Development Workflows](#development-workflows)
6. [Testing](#testing)
7. [Database & Migrations](#database--migrations)
8. [Authentication & Authorization](#authentication--authorization)
9. [API Design Patterns](#api-design-patterns)
10. [Coding Conventions](#coding-conventions)
11. [Deployment](#deployment)
12. [Quick Reference](#quick-reference)
13. [Common Tasks](#common-tasks)

---

## Project Overview

**STIG Manager** is an enterprise-grade API and web client for managing security compliance assessments against DISA (Defense Information Systems Agency) security checklists (STIGs/SRGs).

### Key Characteristics

- **Type:** Full-stack Node.js application
- **License:** MIT with federal employee provisions
- **Architecture:** RESTful API + ExtJS client
- **Database:** MySQL 8.0.24+ / 8.4.x
- **Auth:** OAuth 2.0 / OpenID Connect
- **Deployment:** Docker containers or standalone binaries
- **Documentation:** https://stig-manager.readthedocs.io

### Core Concepts

- **Collections:** Groupings of assets for assessment
- **Assets:** Information systems being assessed
- **STIGs:** Security Technical Implementation Guides (compliance checklists)
- **Reviews:** Assessment findings for specific rules
- **Grants:** Role-based permissions for users/groups

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   ExtJS Client  │  (Browser)
│  (client/src/)  │
└────────┬────────┘
         │ HTTPS + WebSocket
         ▼
┌─────────────────┐
│   Express API   │  (Node.js)
│  (api/source/)  │
└────────┬────────┘
         │ MySQL2
         ▼
┌─────────────────┐
│  MySQL Database │  (8.0.24+ / 8.4.x)
└─────────────────┘
         ▲
         │ OIDC/OAuth
┌─────────────────┐
│  Identity Provider │  (Keycloak, etc.)
└─────────────────┘
```

### Request Flow

```
HTTP Request
  → Multer (file upload middleware)
  → Express parsers (JSON/URL-encoded)
  → CORS middleware
  → Request logger
  → Service health check
  → Authentication (JWT verification via JWKS)
  → User setup (load grants/roles from DB)
  → OpenAPI validation (request/response schema)
  → Controller (route handler)
  → Service layer (business logic)
  → Database access (MySQL pool)
  → Response (JSON)
  → Error handler (standardized errors)
```

### Service-Oriented Design

**Pattern:** Controller → Service → Database

- **Controllers** (`api/source/controllers/`): Route handlers, request/response
- **Services** (`api/source/service/`): Business logic, validation, database queries
- **Utilities** (`api/source/utils/`): Cross-cutting concerns (auth, logging, config)

**8 Core Services:**
1. AssetService
2. CollectionService
3. STIGService
4. ReviewService
5. UserService
6. MetricService
7. JobService (async operations)
8. OperationService

---

## Technology Stack

### API Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | LTS | JavaScript runtime |
| **Framework** | Express | ^4.21.2 | Web framework |
| **Database** | MySQL2 | ^3.11.2 | MySQL driver with promises |
| **Auth** | jsonwebtoken | ^9.0.2 | JWT verification |
| **Auth** | jwks-rsa | ^3.1.0 | JWKS key retrieval/caching |
| **Validation** | express-openapi-validator | ^5.5.3 | OpenAPI schema validation |
| **Migrations** | umzug | ^2.3.0 | Database migration framework |
| **WebSocket** | ws | ^8.18.3 | WebSocket server |
| **Data Export** | csv-stringify | ^6.5.1 | CSV generation |
| **Data Export** | jszip | ^3.10.1 | ZIP file creation |
| **Data Export** | fast-xml-parser | ^4.5.0 | XML parsing/generation |
| **Utilities** | lodash | ^4.17.21 | Utility functions |
| **Logging** | Custom | N/A | Structured JSON logging |

### Client Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | ExtJS | Rich UI components (legacy) |
| **Build** | uglifyjs | JavaScript minification |
| **Charts** | Chart.js | ^4.4.2 | Data visualization |
| **Modules** | @nuwcdivnpt/stig-manager-client-modules | ^1.5.7 | Published client modules |
| **Workers** | Web Workers | Service worker, OIDC, state management |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Mocha** | Test framework |
| **Chai** | Assertion library |
| **c8** | Code coverage |
| **@yao-pkg/pkg** | Binary compilation |
| **Sphinx** | Documentation generation |
| **Docker** | Containerization |
| **GitHub Actions** | CI/CD pipelines |

---

## Directory Structure

```
stig-manager/
├── api/                          # Backend API
│   ├── source/                   # Source code
│   │   ├── bootstrap/            # Server initialization
│   │   │   ├── dependencies.js   # DB, auth, config setup
│   │   │   └── middlewares.js    # Express middleware chain
│   │   ├── controllers/          # Route handlers (8 files)
│   │   │   ├── Asset.js
│   │   │   ├── Collection.js
│   │   │   ├── STIG.js
│   │   │   ├── Review.js
│   │   │   ├── User.js
│   │   │   ├── Metrics.js
│   │   │   ├── Job.js
│   │   │   └── Operation.js
│   │   ├── service/              # Business logic (8 services)
│   │   │   ├── AssetService.js
│   │   │   ├── CollectionService.js
│   │   │   ├── STIGService.js
│   │   │   ├── ReviewService.js
│   │   │   ├── UserService.js
│   │   │   ├── MetricService.js
│   │   │   ├── JobService.js
│   │   │   ├── OperationService.js
│   │   │   ├── utils.js          # Shared service utilities
│   │   │   └── migrations/       # Database migrations (0000-0045)
│   │   │       ├── 0000.js through 0045.js
│   │   │       ├── lib/          # Migration framework
│   │   │       └── sql/          # SQL migration scripts
│   │   ├── specification/        # OpenAPI specs
│   │   │   ├── stig-manager.yaml # Main API spec (OpenAPI 3.0.1)
│   │   │   └── log-socket.yaml   # WebSocket spec (AsyncAPI)
│   │   ├── utils/                # Cross-cutting utilities
│   │   │   ├── auth.js           # JWT/OIDC authentication
│   │   │   ├── config.js         # Environment config
│   │   │   ├── logger.js         # Structured logging
│   │   │   ├── error.js          # Custom error classes
│   │   │   └── state.js          # Application state management
│   │   ├── tls/                  # TLS certificate handling
│   │   ├── patches/              # Package patches (patch-package)
│   │   ├── index.js              # Entry point
│   │   └── package.json
│   ├── bin/                      # Compiled binaries
│   ├── dist/                     # Distribution archives
│   ├── launchers/                # Shell/batch launchers
│   ├── build.sh                  # Binary build script
│   └── pkg.config.json           # Binary packaging config
│
├── client/                       # Frontend web app
│   ├── src/                      # Source files
│   │   ├── js/                   # JavaScript modules
│   │   │   ├── SM/               # STIG Manager modules
│   │   │   ├── modules/          # npm modules (Chart.js, etc.)
│   │   │   ├── workers/          # Web Workers
│   │   │   │   ├── service-worker.js
│   │   │   │   ├── oidc-worker.js
│   │   │   │   └── state-worker.js
│   │   │   └── ext/              # ExtJS framework
│   │   ├── css/                  # Stylesheets
│   │   ├── img/                  # Images
│   │   ├── fonts/                # Fonts
│   │   ├── index.html            # Main entry point
│   │   └── reauth.html           # Re-auth page
│   ├── dist/                     # Built/minified output
│   ├── build.sh                  # Client build script
│   └── package.json
│
├── docs/                         # Sphinx documentation
│   ├── conf.py                   # Sphinx config
│   ├── build.sh                  # Docker-based build
│   ├── requirements.txt          # Python dependencies
│   ├── admin-guide/              # Admin documentation
│   ├── user-guide/               # User documentation
│   ├── installation-and-setup/   # Setup guides
│   ├── the-project/              # Project docs
│   ├── features/                 # Feature docs
│   ├── reference/                # API reference
│   └── _build/html/              # Generated HTML
│
├── test/                         # Test suite
│   ├── api/                      # API tests
│   │   ├── mocha/                # Mocha test framework
│   │   │   ├── integration/      # 13 integration test files
│   │   │   │   ├── asset.test.js
│   │   │   │   ├── collection.test.js
│   │   │   │   ├── stig.test.js
│   │   │   │   ├── review.test.js
│   │   │   │   ├── metrics.test.js
│   │   │   │   ├── job.test.js
│   │   │   │   ├── userStatus.test.js
│   │   │   │   ├── aclResolution.test.js
│   │   │   │   ├── roleResolution.test.js
│   │   │   │   ├── access.test.js
│   │   │   │   ├── grantChange.test.js
│   │   │   │   ├── revisionPinning.test.js
│   │   │   │   └── logStream.test.js
│   │   │   ├── cross-boundary/   # Cross-collection tests
│   │   │   ├── data/             # Test fixtures
│   │   │   ├── utils/            # Test utilities
│   │   │   ├── iterations.js     # Test iterations
│   │   │   ├── referenceData.js  # Reference data
│   │   │   ├── testConfig.js     # Test config
│   │   │   └── expectations.js   # Assertion helpers
│   │   ├── mock-keycloak/        # Mock OIDC provider
│   │   ├── runMocha.sh           # Advanced test runner
│   │   └── package.json          # Test dependencies
│   ├── state/                    # State-level tests
│   └── utils/                    # Utility tests
│
├── data/                         # Data resources
│   ├── appdata/                  # Demo data (JSONL.gz)
│   └── schemas/                  # MySQL Workbench model
│
├── .github/workflows/            # CI/CD
│   ├── api-container-tests.yml   # Multi-version MySQL tests
│   ├── api-binary-tests.yml      # Binary artifact tests
│   ├── pub-docker.yml            # Docker image publication
│   ├── build-client.yml          # Client build
│   └── client-sonarcloud.yml     # Code quality
│
├── Dockerfile                    # Multi-stage Docker build
├── docker-build.sh               # Docker automation
├── .readthedocs.yml              # ReadTheDocs config
├── CONTRIBUTING.md               # Contribution guide (DCO)
├── SECURITY.md                   # Security policy
├── release-notes.rst             # Release history
└── root.json                     # Root package info
```

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/NUWCDIVNPT/stig-manager.git
cd stig-manager

# Setup API
cd api/source
npm ci                            # Clean install dependencies

# Setup Client (if modifying)
cd ../../client
npm ci

# Setup Tests
cd ../test/api
npm ci
```

### Running the API Locally

```bash
cd api/source

# Configure environment (minimum required)
export STIGMAN_DB_HOST=localhost
export STIGMAN_DB_PORT=3306
export STIGMAN_DB_USER=stigman
export STIGMAN_DB_PASSWORD=your_password
export STIGMAN_DB_SCHEMA=stigman
export STIGMAN_OIDC_PROVIDER=https://your-idp/realms/stigman
export STIGMAN_CLIENT_OIDC_PROVIDER=https://your-idp/realms/stigman

# Optional: Development mode settings
export STIGMAN_DEV_ALLOW_INSECURE_TOKENS=true  # For local testing only
export STIGMAN_LOG_LEVEL=4                     # Debug logging

# Start server
npm start                         # Runs: node index.js

# Server starts on http://localhost:54000 by default
# API docs at http://localhost:54000/api-docs
```

### Building the Client

```bash
cd client

# Build (minify JS, copy assets)
./build.sh

# Output: client/dist/
```

### Building the API Binary

```bash
cd api

# Prerequisites:
# - Client must be built first (client/dist/)
# - Docs must be built first (docs/_build/html/)
# - @yao-pkg/pkg must be installed globally

# Build binaries for Windows and Linux
./build.sh

# Output:
# - bin/stig-manager-win.exe
# - bin/stig-manager-linuxstatic
# - dist/*.zip, dist/*.tar.xz (with launchers)
```

### Building Documentation

```bash
cd docs

# Docker-based Sphinx build
./build.sh

# Output: docs/_build/html/
```

### Building Docker Image

```bash
# From repository root

# Prerequisites: Client and docs must be built first

# Build image
docker build \
  --build-arg COMMIT_BRANCH=$(git branch --show-current) \
  --build-arg COMMIT_SHA=$(git rev-parse HEAD) \
  --build-arg COMMIT_TAG=$(git describe --tags --always) \
  -t stig-manager:local \
  .

# Or use automation script
./docker-build.sh
```

---

## Testing

### Test Framework: Mocha + Chai

**Location:** `test/api/mocha/`

### Running Tests

```bash
cd test/api

# Basic test run (all tests)
npm test

# Using advanced test runner
./runMocha.sh                     # All tests
./runMocha.sh -p "getAssets"      # Pattern matching
./runMocha.sh -f asset.test.js    # Specific file
./runMocha.sh -d integration      # Specific directory
./runMocha.sh -i lvl1 -i lvl2     # By iteration
./runMocha.sh -b                  # Bail on first failure
./runMocha.sh -c                  # With coverage (c8)
./runMocha.sh -s update           # Update metrics baseline
```

### Test Structure Pattern

```javascript
// test/api/mocha/integration/asset.test.js

describe('PUT - operationId - /api/path', () => {
  describe('specific scenario', () => {
    it('should do something specific', async function() {
      // Arrange
      const data = { ... }
      const url = `http://localhost:${port}/api/assets/${assetId}`

      // Act
      const res = await chai.request(url)
        .put(url)
        .set('Authorization', `Bearer ${token}`)
        .send(data)

      // Assert
      expect(res).to.have.status(200)
      expect(res.body).to.deep.equal(expectedData)
    })
  })
})
```

### Test Configuration

**Required Environment Variables:**
```bash
export STIGMAN_DB_HOST=localhost
export STIGMAN_DB_PORT=50001        # Test database port
export STIGMAN_DB_USER=stigman
export STIGMAN_DB_PASSWORD=stigman
export STIGMAN_DB_SCHEMA=stigman_test
export STIGMAN_OIDC_PROVIDER=http://localhost:8080/auth/realms/stigman
```

### Test Utilities

- **Fixtures:** `test/api/mocha/data/` - Test data by resource type
- **Reference Data:** `test/api/mocha/referenceData.js` - Expected responses
- **Iterations:** `test/api/mocha/iterations.js` - Test groupings by privilege level
- **Helpers:** `test/api/mocha/utils/` - Auth, expectations, utils

### Mock OIDC Provider

```bash
# Start mock Keycloak for testing
cd test/api/mock-keycloak
python3 -m http.server 8080
```

### CI/CD Testing

**GitHub Actions workflow:** `.github/workflows/api-container-tests.yml`

- Tests against multiple MySQL versions (8.0.24+, 8.4.x)
- Runs full Mocha suite
- Generates coverage reports
- Uploads test artifacts

---

## Database & Migrations

### Database Requirements

- **MySQL:** 8.0.24+ or 8.4.x
- **Character Set:** utf8mb4
- **Collation:** utf8mb4_0900_ai_ci (MySQL 8.0+)
- **InnoDB:** Default storage engine

### Connection Management

**File:** `api/source/service/utils.js`

```javascript
// MySQL2 promise pool
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.username,
  password: config.database.password,
  database: config.database.schema,
  connectionLimit: config.database.maxConnections, // Default: 25
  waitForConnections: true,
  queueLimit: 0,
  // TLS options if configured
  ssl: config.database.tls ? {...} : undefined,
  // TCP keepalive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})
```

### Migration System

**Framework:** Umzug with custom MySQL storage adapter

**Location:** `api/source/service/migrations/`

**Structure:**
```
migrations/
├── 0000.js through 0045.js       # 46 numbered migrations
├── lib/
│   ├── MigrationHandler.js       # Base migration class
│   ├── mysql-import.js           # SQL file importer
│   └── umzug-mysql-storage.js    # Umzug storage adapter
└── sql/
    ├── 0000/ through 0006/       # SQL scripts by version
    └── current/                  # Latest schema
```

### Running Migrations

Migrations run automatically on API startup:

```javascript
// api/source/bootstrap/dependencies.js
async function initializeDatabase() {
  await doMigrations(pool)  // Runs pending migrations
}
```

**Manual migration revert:**
```bash
export STIGMAN_DB_REVERT=true
npm start                         # Reverts last migration and exits
```

### Creating a New Migration

1. Create new migration file: `api/source/service/migrations/0046.js`

```javascript
const MigrationHandler = require('./lib/MigrationHandler')

const upCommands = [
  'ALTER TABLE collection ADD COLUMN new_field VARCHAR(255)',
  // Or use SQL file:
  `@migrations/sql/0046/001-up.sql`
]

const downCommands = [
  'ALTER TABLE collection DROP COLUMN new_field',
  // Or:
  `@migrations/sql/0046/001-down.sql`
]

module.exports = {
  up: async (pool) => {
    const handler = new MigrationHandler(upCommands, downCommands)
    await handler.up(pool, __filename)
  },
  down: async (pool) => {
    const handler = new MigrationHandler(upCommands, downCommands)
    await handler.down(pool, __filename)
  }
}
```

2. If using SQL files, create: `api/source/service/migrations/sql/0046/001-up.sql`

3. Test migration:
```bash
# Start API (migration runs automatically)
npm start

# Check logs for migration execution
# {"level":3,"component":"mysql","type":"migration","data":{"status":"start","direction":"up","name":"0046"}}
```

### Core Database Entities

| Table | Purpose |
|-------|---------|
| `collection` | Assessment collections |
| `asset` | Information systems |
| `stig` | Security guides (STIG/SRG) |
| `revision` | STIG revisions |
| `rule` | Individual security rules |
| `review` | Assessment findings |
| `user_data` | User accounts |
| `collection_grant` | User permissions |
| `stig_asset_map` | Asset-STIG assignments |
| `user_stig_asset_map` | Asset-user assignments |
| `job` | Async operation tracking |
| `label` | Asset tagging |

---

## Authentication & Authorization

### OAuth 2.0 / OpenID Connect Flow

```
1. Client initiates login
   → Redirects to OIDC Provider

2. User authenticates with IdP
   → IdP returns authorization code

3. Client exchanges code for tokens
   → Access token (JWT) + Refresh token

4. Client includes token in API requests
   Authorization: Bearer <jwt_token>

5. API validates token
   → Fetch JWKS from IdP (cached)
   → Verify signature
   → Verify claims (aud, exp, etc.)

6. API loads user from database
   → Extract username from JWT claim
   → Load grants/roles from database
   → Attach to req.userObject
```

### JWT Token Structure

**Expected Claims:**
```json
{
  "aud": "stig-manager",                    // Audience
  "exp": 1700000000,                        // Expiration
  "iat": 1699990000,                        // Issued at
  "scope": "stig-manager:stig:read ...",    // Scopes
  "username": "john.doe",                   // Username claim
  "privileges": ["admin", "user"],          // Privilege claim
  "email": "john.doe@example.com"
}
```

**Configuration:**
```bash
# Token claim mapping
export STIGMAN_JWT_SCOPE_CLAIM=scope
export STIGMAN_JWT_USERNAME_CLAIM=username
export STIGMAN_JWT_PRIVILEGES_CLAIM=privileges
export STIGMAN_JWT_AUD_VALUE=stig-manager

# OIDC provider
export STIGMAN_OIDC_PROVIDER=https://idp.example.com/realms/stigman
```

### Authorization Model

**Role-Based Access Control (RBAC):**

| Role ID | Role Name | Permissions |
|---------|-----------|-------------|
| 0 | None | No access |
| 1 | Reader | View collections, assets, reviews (read-only) |
| 2 | Reviewer | Submit/modify reviews, view collections/assets |
| 3 | Creator/Owner | Full CRUD on assets, STIGs, reviews, labels |
| 4 | Admin | Collection management, user grants |

**Grant Resolution:**
```javascript
// api/source/utils/auth.js - userSetup middleware

// Load user grants from database
const grants = {
  [collectionId]: {
    collectionId: "123",
    roleId: 3,           // Creator
    roleName: "Creator",
    accessLevel: 3       // Same as roleId
  }
}

// Attach to request
req.userObject = {
  userId: "user-123",
  username: "john.doe",
  displayName: "John Doe",
  privileges: {
    globalAccess: false,
    canAdmin: false,
    canCreateCollection: false
  },
  grants: grants
}
```

**Privilege Checking:**
```javascript
// In controller
const grant = req.userObject.grants[collectionId]
if (!grant) {
  throw new SmError.OutOfScopeError()  // 403
}
if (grant.roleId < 3) {
  throw new SmError.PrivilegeError()   // 403
}
```

### Custom Error Classes

**File:** `api/source/utils/error.js`

```javascript
class SmError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
  }
}

class AuthorizeError extends SmError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

class PrivilegeError extends SmError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}

class NotFoundError extends SmError {
  constructor(message = 'Not Found') {
    super(message, 404)
  }
}

class UnprocessableError extends SmError {
  constructor(data, message = 'Unprocessable Entity') {
    super(message, 422)
    this.data = data  // Validation failures
  }
}
```

---

## API Design Patterns

### OpenAPI-Driven Development

**Specification:** `api/source/specification/stig-manager.yaml`

All endpoints must:
1. Be defined in OpenAPI spec
2. Include request/response schemas
3. Pass validation via `express-openapi-validator`

### Controller Pattern

**Location:** `api/source/controllers/`

**Example:** `Asset.js`

```javascript
'use strict'

const AssetService = require('../service/AssetService')
const dbUtils = require('../service/utils')
const SmError = require('../utils/error')

module.exports.getAssets = async function (req, res, next) {
  try {
    // Extract parameters
    const collectionId = req.params.collectionId
    const options = req.query

    // Check authorization
    const grant = req.userObject.grants[collectionId]
    if (!grant) {
      throw new SmError.OutOfScopeError()
    }

    // Call service
    const assets = await AssetService.getAssets({
      collectionId,
      options,
      userObject: req.userObject
    })

    // Send response
    res.status(200).json(assets)
  } catch (err) {
    next(err)  // Pass to error handler
  }
}

module.exports.createAsset = async function (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const body = req.body

    // Check authorization (must be Creator or higher)
    const grant = req.userObject.grants[collectionId]
    if (!grant || grant.roleId < 3) {
      throw new SmError.PrivilegeError()
    }

    // Validate
    const failures = await dbUtils.createAssetValidation({
      assets: [body],
      collectionId
    })
    if (failures.length > 0) {
      throw new SmError.UnprocessableError(failures)
    }

    // Create asset
    const assetId = await AssetService.createAssets({
      assets: [body],
      collectionId,
      svcStatus: {}
    })

    // Return created asset
    const asset = await AssetService.getAsset({
      assetId,
      userObject: req.userObject
    })

    res.status(201).json(asset)
  } catch (err) {
    next(err)
  }
}
```

### Service Pattern

**Location:** `api/source/service/`

**Example:** `AssetService.js`

```javascript
'use strict'

const dbUtils = require('./utils')

exports.getAssets = async function ({
  collectionId,
  options = {},
  userObject
}) {
  try {
    // Build query based on options
    const sql = `
      SELECT
        a.assetId,
        a.name,
        a.description,
        a.ip,
        a.mac,
        CAST(a.metadata as CHAR) as metadata
      FROM
        asset a
      WHERE
        a.collectionId = ?
      ORDER BY a.name
    `

    const [rows] = await dbUtils.pool.query(sql, [collectionId])

    // Post-process results
    const assets = rows.map(row => ({
      assetId: row.assetId,
      name: row.name,
      description: row.description,
      ip: row.ip,
      mac: row.mac,
      metadata: row.metadata ? JSON.parse(row.metadata) : {}
    }))

    return assets
  } catch (err) {
    throw err
  }
}

exports.createAssets = async function ({
  assets,
  collectionId,
  svcStatus = {}
}) {
  try {
    const connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')

    try {
      // Insert assets
      for (const asset of assets) {
        const [result] = await connection.query(`
          INSERT INTO asset (name, description, ip, mac, collectionId, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          asset.name,
          asset.description,
          asset.ip,
          asset.mac,
          collectionId,
          JSON.stringify(asset.metadata || {})
        ])

        asset.assetId = result.insertId
      }

      await connection.query('COMMIT')

      // Return first asset ID (for single create)
      return assets[0].assetId
    } catch (err) {
      await connection.query('ROLLBACK')
      throw err
    } finally {
      connection.release()
    }
  } catch (err) {
    throw err
  }
}
```

### Error Handling

**Global Error Handler:** `api/source/bootstrap/middlewares.js`

```javascript
function configureErrorHandlers(app) {
  // OpenAPI validation errors
  app.use((err, req, res, next) => {
    if (err.status === 400 && err.errors) {
      // OpenAPI validation failure
      return res.status(400).json({
        error: 'Bad Request',
        message: err.message,
        errors: err.errors
      })
    }
    next(err)
  })

  // SmError custom errors
  app.use((err, req, res, next) => {
    if (err instanceof SmError) {
      const response = {
        error: err.constructor.name,
        message: err.message
      }
      if (err.data) {
        response.data = err.data  // Validation failures
      }
      return res.status(err.status).json(response)
    }
    next(err)
  })

  // Generic error handler
  app.use((err, req, res, next) => {
    logger.writeError('app', 'error', {
      message: err.message,
      stack: err.stack
    })

    res.status(500).json({
      error: 'InternalError',
      message: 'An unexpected error occurred'
    })
  })
}
```

### Response Patterns

**Success Responses:**

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | `res.status(200).json(data)` |
| 201 | Created | `res.status(201).json(createdResource)` |
| 204 | No Content | `res.status(204).end()` |

**Error Responses:**

| Code | Error Class | Meaning |
|------|-------------|---------|
| 400 | ClientError | Bad request / validation error |
| 401 | AuthorizeError | Missing/invalid token |
| 403 | PrivilegeError | Insufficient permissions |
| 404 | NotFoundError | Resource not found |
| 409 | EndpointUnavailableError | Conflict / endpoint locked |
| 422 | UnprocessableError | Business logic validation failure |
| 503 | OIDCProviderError | OIDC provider unavailable |
| 500 | InternalError | Unexpected server error |

---

## Coding Conventions

### JavaScript Style

**Module System:** CommonJS
```javascript
// Use require/module.exports
const express = require('express')
const MyService = require('./service/MyService')

module.exports.myFunction = async function(params) {
  // ...
}
```

**Strict Mode:**
```javascript
'use strict'  // At top of every file
```

**Async/Await Pattern:**
```javascript
// Always use async/await (not callbacks or .then())
async function getData() {
  try {
    const result = await pool.query(sql, params)
    return result
  } catch (err) {
    throw err  // Re-throw for error middleware
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `assetId`, `collectionId` |
| Functions | camelCase | `getAssets`, `createAsset` |
| Classes | PascalCase | `MigrationHandler`, `SmError` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PORT`, `MAX_CONNECTIONS` |
| Private/internal | _leading underscore | `_upCommands`, `_privateMethod` |

### Database Query Pattern

```javascript
// Standard pattern:
const [rows] = await pool.query(sql, params)

// rows is array of result objects
// For INSERT: rows = { insertId, affectedRows, ... }
// For SELECT: rows = [{ col1, col2 }, ...]

// Named parameters not used - use ? placeholders
const sql = 'SELECT * FROM asset WHERE assetId = ?'
const [rows] = await pool.query(sql, [assetId])

// Transaction pattern:
const connection = await pool.getConnection()
await connection.query('START TRANSACTION')
try {
  await connection.query(sql1, params1)
  await connection.query(sql2, params2)
  await connection.query('COMMIT')
} catch (err) {
  await connection.query('ROLLBACK')
  throw err
} finally {
  connection.release()
}
```

### Logging Pattern

**File:** `api/source/utils/logger.js`

```javascript
// Structured JSON logging
const logger = require('./utils/logger')

logger.writeInfo(component, type, data)
logger.writeWarn(component, type, data)
logger.writeError(component, type, data)
logger.writeDebug(component, type, data)

// Example:
logger.writeInfo('asset', 'create', {
  assetId: result.insertId,
  collectionId: collectionId,
  userId: req.userObject.userId
})

// Output:
// {"date":"2024-11-16T12:00:00.000Z","level":3,"component":"asset","type":"create","data":{...}}
```

**Log Levels:**
- 1 = ERROR only
- 2 = ERROR + WARN
- 3 = ERROR + WARN + INFO (default)
- 4 = All (DEBUG)

**Configure:** `export STIGMAN_LOG_LEVEL=4`

### Configuration Pattern

**File:** `api/source/utils/config.js`

All configuration via environment variables:

```javascript
const config = {
  http: {
    address: process.env.STIGMAN_API_ADDRESS || '0.0.0.0',
    port: process.env.STIGMAN_API_PORT || 54000,
    maxJsonBody: process.env.MAX_JSON_BODY || '5242880',
    maxUpload: process.env.MAX_UPLOAD || '1073741824'
  },
  database: {
    host: process.env.STIGMAN_DB_HOST || 'localhost',
    port: process.env.STIGMAN_DB_PORT || 3306,
    schema: process.env.STIGMAN_DB_SCHEMA || 'stigman',
    username: process.env.STIGMAN_DB_USER,
    password: process.env.STIGMAN_DB_PASSWORD,
    maxConnections: process.env.STIGMAN_DB_MAX_CONNECTIONS || 25
  },
  oauth: {
    authority: process.env.STIGMAN_OIDC_PROVIDER,
    scopeClaim: process.env.STIGMAN_JWT_SCOPE_CLAIM || 'scope',
    usernameClaim: process.env.STIGMAN_JWT_USERNAME_CLAIM || 'username'
  }
}
```

### File Naming

- **Controllers:** PascalCase (e.g., `Asset.js`, `Collection.js`)
- **Services:** PascalCase + "Service" (e.g., `AssetService.js`)
- **Utilities:** camelCase (e.g., `logger.js`, `auth.js`)
- **Migrations:** Numbers (e.g., `0045.js`)
- **Tests:** kebab-case + `.test.js` (e.g., `asset.test.js`)

---

## Deployment

### Docker Deployment

**Image:** `nuwcdivnpt/stig-manager:latest`

**Docker Hub:** https://hub.docker.com/r/nuwcdivnpt/stig-manager

**Run Container:**
```bash
docker run -d \
  --name stig-manager \
  -p 54000:54000 \
  -e STIGMAN_DB_HOST=mysql-server \
  -e STIGMAN_DB_PORT=3306 \
  -e STIGMAN_DB_USER=stigman \
  -e STIGMAN_DB_PASSWORD=your_password \
  -e STIGMAN_DB_SCHEMA=stigman \
  -e STIGMAN_OIDC_PROVIDER=https://idp.example.com/realms/stigman \
  -e STIGMAN_CLIENT_OIDC_PROVIDER=https://idp.example.com/realms/stigman \
  nuwcdivnpt/stig-manager:latest
```

**Docker Compose Example:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: stigman
      MYSQL_USER: stigman
      MYSQL_PASSWORD: stigman_password
    volumes:
      - mysql-data:/var/lib/mysql
    ports:
      - "3306:3306"

  stig-manager:
    image: nuwcdivnpt/stig-manager:latest
    depends_on:
      - mysql
    ports:
      - "54000:54000"
    environment:
      STIGMAN_DB_HOST: mysql
      STIGMAN_DB_PORT: 3306
      STIGMAN_DB_USER: stigman
      STIGMAN_DB_PASSWORD: stigman_password
      STIGMAN_DB_SCHEMA: stigman
      STIGMAN_OIDC_PROVIDER: https://idp.example.com/realms/stigman
      STIGMAN_CLIENT_OIDC_PROVIDER: https://idp.example.com/realms/stigman
      STIGMAN_LOG_LEVEL: 3

volumes:
  mysql-data:
```

### Binary Deployment

**Download:** From GitHub Releases

**Windows:**
```cmd
stig-manager-win.exe
```

**Linux:**
```bash
chmod +x stig-manager-linuxstatic
./stig-manager-linuxstatic
```

**Configuration:** Environment variables or `.env` file

### Environment Variables Reference

**Critical Variables:**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STIGMAN_DB_HOST` | Yes | localhost | Database hostname |
| `STIGMAN_DB_PORT` | No | 3306 | Database port |
| `STIGMAN_DB_USER` | Yes | - | Database username |
| `STIGMAN_DB_PASSWORD` | Yes | - | Database password |
| `STIGMAN_DB_SCHEMA` | Yes | - | Database schema name |
| `STIGMAN_OIDC_PROVIDER` | Yes | - | OIDC provider URL |
| `STIGMAN_API_PORT` | No | 54000 | HTTP server port |
| `STIGMAN_API_ADDRESS` | No | 0.0.0.0 | Bind address |

**Optional Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `STIGMAN_DB_MAX_CONNECTIONS` | 25 | Connection pool size |
| `STIGMAN_LOG_LEVEL` | 3 | Log verbosity (1-4) |
| `STIGMAN_CLIENT_ID` | stig-manager | OAuth client ID |
| `STIGMAN_JWT_SCOPE_CLAIM` | scope | JWT scope claim name |
| `STIGMAN_JWT_USERNAME_CLAIM` | username | JWT username claim |
| `MAX_JSON_BODY` | 5242880 | Max JSON body size (bytes) |
| `MAX_UPLOAD` | 1073741824 | Max upload size (bytes) |

**TLS Variables:**
```bash
STIGMAN_DB_TLS_CA_FILE=/path/to/ca.pem
STIGMAN_DB_TLS_CERT_FILE=/path/to/cert.pem
STIGMAN_DB_TLS_KEY_FILE=/path/to/key.pem
```

**Development Variables:**
```bash
STIGMAN_DEV_ALLOW_INSECURE_TOKENS=true      # Skip signature verification
STIGMAN_DEV_RESPONSE_VALIDATION=logOnly     # Log validation errors
STIGMAN_DEV_LOG_OPT_STATS=true              # Log optimization stats
```

### Health Check

```bash
# Check API health
curl http://localhost:54000/api/op/definition

# Should return 200 with API metadata
```

---

## Quick Reference

### Key File Locations

| Purpose | Path |
|---------|------|
| **API Entry Point** | `api/source/index.js` |
| **API Controllers** | `api/source/controllers/*.js` |
| **API Services** | `api/source/service/*Service.js` |
| **OpenAPI Spec** | `api/source/specification/stig-manager.yaml` |
| **Database Migrations** | `api/source/service/migrations/` |
| **Auth Logic** | `api/source/utils/auth.js` |
| **Logger** | `api/source/utils/logger.js` |
| **Config** | `api/source/utils/config.js` |
| **Error Classes** | `api/source/utils/error.js` |
| **Client Entry** | `client/src/index.html` |
| **Client JavaScript** | `client/src/js/` |
| **Tests** | `test/api/mocha/integration/` |
| **Documentation** | `docs/` |

### Common Commands

```bash
# API Development
cd api/source && npm ci && npm start

# Run Tests
cd test/api && npm test
cd test/api && ./runMocha.sh -c              # With coverage

# Build Client
cd client && ./build.sh

# Build Docs
cd docs && ./build.sh

# Build API Binary
cd api && ./build.sh

# Build Docker Image
docker build -t stig-manager:local .

# View Logs (structured JSON)
npm start | jq .                              # Pretty-print JSON logs
```

### Useful npm Scripts

```bash
# API (api/source/package.json)
npm start                                     # Start API server
npm ci                                        # Clean install dependencies

# Client (client/package.json)
npm ci                                        # Install dependencies
# (Build via build.sh, not npm script)

# Tests (test/api/package.json)
npm test                                      # Run all Mocha tests
```

### Database Quick Reference

```bash
# Connect to MySQL
mysql -h localhost -P 3306 -u stigman -p stigman

# Common queries
SELECT * FROM collection;
SELECT * FROM asset WHERE collectionId = 1;
SELECT * FROM review WHERE assetId = 1;
SELECT * FROM user_data;
SELECT * FROM collection_grant;

# Check migration state
SELECT * FROM umzug;
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Update OpenAPI spec:** `api/source/specification/stig-manager.yaml`

```yaml
/api/assets/{assetId}/custom:
  get:
    tags:
      - Asset
    summary: Get custom asset data
    operationId: getAssetCustom
    parameters:
      - name: assetId
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Success
        content:
          application/json:
            schema:
              type: object
              properties:
                customField:
                  type: string
```

2. **Add service method:** `api/source/service/AssetService.js`

```javascript
exports.getAssetCustom = async function ({ assetId }) {
  const sql = 'SELECT customField FROM asset WHERE assetId = ?'
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  if (rows.length === 0) {
    throw new SmError.NotFoundError('Asset not found')
  }
  return rows[0]
}
```

3. **Add controller:** `api/source/controllers/Asset.js`

```javascript
module.exports.getAssetCustom = async function (req, res, next) {
  try {
    const assetId = req.params.assetId
    const result = await AssetService.getAssetCustom({ assetId })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
```

4. **Test:** `test/api/mocha/integration/asset.test.js`

```javascript
describe('GET - getAssetCustom - /api/assets/{assetId}/custom', () => {
  it('should return custom data', async function() {
    const res = await chai
      .request(`http://localhost:${port}`)
      .get('/api/assets/123/custom')
      .set('Authorization', `Bearer ${token}`)

    expect(res).to.have.status(200)
    expect(res.body).to.have.property('customField')
  })
})
```

### Adding a New Database Column

1. **Create migration:** `api/source/service/migrations/0046.js`

```javascript
const MigrationHandler = require('./lib/MigrationHandler')

const upCommands = [
  'ALTER TABLE asset ADD COLUMN newField VARCHAR(255) DEFAULT NULL'
]

const downCommands = [
  'ALTER TABLE asset DROP COLUMN newField'
]

module.exports = {
  up: async (pool) => {
    const handler = new MigrationHandler(upCommands, downCommands)
    await handler.up(pool, __filename)
  },
  down: async (pool) => {
    const handler = new MigrationHandler(upCommands, downCommands)
    await handler.down(pool, __filename)
  }
}
```

2. **Update OpenAPI schema:** Add field to asset schema

3. **Update service queries:** Include new field in SELECT/INSERT/UPDATE

4. **Test migration:** Restart API, check logs for migration execution

### Debugging

**Enable debug logging:**
```bash
export STIGMAN_LOG_LEVEL=4
npm start
```

**Filter logs by component:**
```bash
npm start | jq 'select(.component == "mysql")'
npm start | jq 'select(.component == "asset")'
```

**Check request/response validation:**
```bash
export STIGMAN_DEV_RESPONSE_VALIDATION=logOnly
npm start
# Logs validation errors without failing requests
```

### Running Partial Tests

```bash
cd test/api

# Run only asset tests
./runMocha.sh -f asset.test.js

# Run only tests matching "getAssets"
./runMocha.sh -p "getAssets"

# Run tests for specific iteration (privilege level)
./runMocha.sh -i lvl1                         # Read-only tests
./runMocha.sh -i lvl2                         # Reviewer tests
./runMocha.sh -i lvl3                         # Creator tests

# Bail on first failure
./runMocha.sh -b
```

---

## Additional Resources

- **Main Documentation:** https://stig-manager.readthedocs.io
- **GitHub Repository:** https://github.com/NUWCDIVNPT/stig-manager
- **Docker Hub:** https://hub.docker.com/r/nuwcdivnpt/stig-manager
- **DISA STIGs:** https://public.cyber.mil/stigs/
- **Contributing Guide:** See `CONTRIBUTING.md`
- **Security Policy:** See `SECURITY.md`
- **Release Notes:** See `release-notes.rst`

---

## Notes for AI Assistants

### Best Practices

1. **Always validate against OpenAPI spec** before modifying endpoints
2. **Follow service-controller pattern** - don't put business logic in controllers
3. **Use structured logging** - include component, type, and data
4. **Handle errors properly** - use SmError classes, pass to next()
5. **Respect authorization** - check grants before operations
6. **Write tests** for new features - integration tests in mocha/
7. **Document changes** - update OpenAPI spec and docs/
8. **Create migrations** for schema changes - don't modify database directly
9. **Use transactions** for multi-query operations
10. **Follow naming conventions** - camelCase for functions/vars, PascalCase for classes

### Common Pitfalls

1. **Don't bypass OpenAPI validation** - all endpoints must match spec
2. **Don't skip authorization checks** - always verify grants
3. **Don't use callbacks** - use async/await consistently
4. **Don't modify state.json** - it's auto-generated
5. **Don't commit node_modules** - use .gitignore
6. **Don't use var** - use const/let
7. **Don't forget error handling** - wrap in try/catch
8. **Don't hardcode configuration** - use environment variables
9. **Don't skip tests** - run before committing
10. **Don't mix concerns** - keep controllers thin, services focused

### When Making Changes

- [ ] Update OpenAPI spec if adding/modifying endpoints
- [ ] Add/update tests for new functionality
- [ ] Create migration if modifying database schema
- [ ] Update documentation if changing user-facing features
- [ ] Check authorization logic for new endpoints
- [ ] Verify error handling with appropriate SmError classes
- [ ] Test with different privilege levels (lvl1, lvl2, lvl3)
- [ ] Run full test suite: `cd test/api && ./runMocha.sh`
- [ ] Check code coverage: `./runMocha.sh -c`
- [ ] Review logs for errors/warnings
- [ ] Update CLAUDE.md if architectural changes made

---

**End of CLAUDE.md**
