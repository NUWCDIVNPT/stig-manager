# STIG Manager Phase 1 Roadmap

## Summary

Our goals for Phase 1 of the Project are:

- Define a new REST API as an OpenAPI 3.0 specification implemented in Node.js
- Refactor the current UI so all API calls are made to the new API
- Provide runtime selection of the data backend with initial support for Oracle and MySQL
- Establish a deployment/initialization process suitable for production use

Once this milestone is reached, we will tag the code in the `master` branch as version 3.0.0. We will then begin Phase 2, whose roadmap will be documented as we get closer.

## Details

### Define a new REST API

The new API has being designed following API First principles, which means our OpenAPI 3.0 specification is considered the Project's sole source of truth. The specification is used within the Node.js implementation to validate all requests. During Phase 1, we do not yet validating responses against the API specification.

### Refactor the current UI

The current UI uses an older JavaScript framework (ExtJS 3.4) which has served us well. During Phase 1, we are retaining the current UI while refactoring it to make calls to the new API.

As features become available in the new API, the UI will be refactored to call them.

### Runtime selection of the data backend

The Project intends to support runtime selection of the data storage backend. During Phase 1 we will provide support for Oracle and MySQL. During Phase 2, contributors will add support for additional data storage technologies by creating product specific Service files.

### Establish a deployment/initialization process

The Project will implement a robust deployment and initialization process that fully supports Docker containerization.