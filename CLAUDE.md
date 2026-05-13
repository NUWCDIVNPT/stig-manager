# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

STIG Manager is a web application for managing STIG (Security Technical Implementation Guide) assessments of Information Systems. It consists of a Node.js/Express REST API and two web clients: a legacy ExtJS client and a new Vue.js client (in development).

The application tracks STIG compliance status across assets, supports manual reviews and automated imports (CKL/CKLB/XCCDF), and provides metrics dashboards. It requires an OIDC provider (Keycloak, Okta, Azure Entra ID) and MySQL 8.4+.

## Repository Structure

- `api/source/` - Express.js REST API with OpenAPI 3.0.1 specification
- `client/` - Legacy ExtJS 3.4.1 web client
- `clientV2/` - New Vue.js/Vite web client (under development)
- `test/api/` - API tests (Mocha/Chai)
- `test/state/` - Database state tests
- `docs/` - Sphinx documentation (hosted on ReadTheDocs)
- `data/` - Application data and database schemas

## Common Commands

### API Development
```bash
cd api/source
npm ci
node index.js
```

### Client Development (Legacy ExtJS)
Build distribution:
```bash
cd client
./build.sh  # Requires uglify-js: npm install -g uglify-js
```

Develop without building (serve source directly):
```bash
cd client/src/js/modules && npm ci
cd api/source
STIGMAN_CLIENT_DIRECTORY=../../client/src node index.js
```

### Running Tests
All API tests:
```bash
cd test/api
npm ci
./runMocha.sh
```

Run specific test file:
```bash
./runMocha.sh -f collectionGet.test.js
```

Run tests matching a pattern:
```bash
./runMocha.sh -p "getCollections"
./runMocha.sh -p "getCollections|getAsset"
```

Run tests in a specific directory:
```bash
./runMocha.sh -d mocha/data/collection
```

Run tests for specific iteration (user scenario):
```bash
./runMocha.sh -i lvl1
./runMocha.sh -i lvl1 -i lvl2 -p getCollections
```

Run with bail (stop on first failure):
```bash
./runMocha.sh -b
```

Run with coverage:
```bash
./runMocha.sh -c
```

State tests:
```bash
cd test/state
npm test
```

### Documentation
```bash
cd docs
pip install -r requirements.txt
make html  # Output in _build/html/
```

### Docker Build
```bash
./docker-build.sh
```

## Architecture

### API Layer
- `api/source/controllers/` - Request handlers mapped from OpenAPI spec
- `api/source/service/` - Business logic services (AssetService, CollectionService, ReviewService, STIGService, UserService, MetricsService, etc.)
- `api/source/specification/stig-manager.yaml` - OpenAPI 3.0.1 specification (authoritative API contract)
- `api/source/service/migrations/` - Database migrations via Umzug

### ExtJS Client
- Frontend uses ExtJS 3.4.1 with components in the `SM` namespace
- Key modules in `client/src/js/SM/`
- Pay attention to component lifecycle events (`afterrender`, `viewready`)
- Use `silent: true` on selection models when programmatically updating to avoid unwanted event cascades
- The `viewready` event is often better than `afterrender` for grid operations

### Vue.js Client (clientV2)
Development rules from `clientV2/docs/general-guidance.md`:
- No explicit font sizes - use rem/em units
- No explicit colors - use theme variables
- Minimize styles in components - prefer global styles
- No semi-colons in JS files unless absolutely necessary
- Do not remove watch statements unless told to do so
- Do not build or lint unless asked
- Uses PrimeVue 4 component library
- Feature pages use an **orchestrator pattern** (see `clientV2/docs/components/LogicExtraction.md`):
  - The main `.vue` component handles route params, coordinates loading across composables, and passes data to children via props
  - Composables (`use*.js`) each own a self-contained domain slice -- their own API calls, reactive refs, and error handling
  - Extract a composable when logic manages its own async data cycle or groups 2+ related refs into a coherent concept
  - Keep logic inline in the `.vue` when it is glue between composables or depends on `useRouter`/`useRoute`
- Errors are handled in tiers (see `clientV2/docs/architecture/fetching-asyncDataOperations-ErrorHandling.md`):
  - Route-level (redirect), page-level (inline banner), panel-level (inline + retry), action-level (near trigger), unexpected (global modal default)
- `apiClient.js` for all HTTP calls; `useAsyncState` for async lifecycle
- Reference implementation: `AssetReview/` feature demonstrates all patterns

### Test Structure
- `test/api/mocha/data/` - Endpoint-specific tests (pattern: `<apiTag><HTTPMethod>.test.js`)
- `test/api/mocha/integration/` - Integration tests
- `test/api/mocha/cross-boundary/` - Cross-boundary scenarios
- `test/api/mocha/iterations.js` - Test user scenarios (lvl1, lvl2, etc.)
- Each test module typically has `referenceData.js` and `expectations.js`

## Contributing

Contributions require signing the Developer's Certificate of Origin (DCO). Add your name and email to `CONTRIBUTORS.md` before submitting your first PR. All PRs must pass API tests.

## Specialized Agent

An RMF/STIG documentation expert agent is available (`.claude/agents/rmf-stig-documentation-expert.md`) for reviewing documentation related to DoD RMF processes and STIG compliance workflows.



## Other Guidelines

Always use Context7 when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.