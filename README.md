# Receiptor Docs (Mintlify)

This app contains Receiptor developer documentation focused on public integration contracts:

- API key auth and workspace context
- External API and capabilities
- MCP transport and OAuth2
- CLI usage

## Local development

From this directory:

```bash
npm run dev
```

The docs run on `http://localhost:3333`.

## Notes

- `openapi` points to `https://developer.api.receiptor.ai/openapi.json`.
- Capability schemas are generated from backend Zod definitions and surfaced through `GET /v1/capabilities`.
