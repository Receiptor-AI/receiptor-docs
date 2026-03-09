# Receiptor Docs (Mintlify)

This app contains Receiptor developer documentation focused on public integration contracts:

- API key auth and workspace context
- External API and capabilities
- MCP transport and OAuth2
- CLI usage
- auto-generated live capability catalog (`api/capabilities/live-catalog.mdx`)

## Local development

From this directory:

```bash
npm run dev
```

The docs run on `http://localhost:3333`.

To refresh the live capabilities catalog from:

- `https://developer.api.receiptor.ai/v1/capabilities`

Manual sync commands:

```bash
npm run capabilities:sync
npm run capabilities:sync:staging
```

## Notes

- `docs.json` is the Mintlify config source of truth.
- OpenAPI is wired to `https://developer.api.receiptor.ai/openapi.json`.
- Capability schemas are generated from backend Zod definitions and surfaced through `GET /v1/capabilities`.
