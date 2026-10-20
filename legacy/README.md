# Archived SQL Server implementation

The uploaded project mixed a Vite ES module frontend with an incomplete CommonJS
SQL Server backend. The services, backend routes, several models and response
helpers required by that backend were missing. These files are preserved for
reference and are **not executed or imported** by the current application.

The supported backend is `server/`, uses SQLite on Node 24, and has automated API
tests. No SQL Server migration/import is performed. If an existing SQL Server
instance contains real users or learning data, arrange a separate reviewed data
migration before switching that live installation.
