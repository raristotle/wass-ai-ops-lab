# Publishing Meridian to the MCP Registry — #19

Meridian ships an MCP server (`docs/mcp-servers.md`) that exposes the recommender
to agentic clients. This adds the descriptor needed to **publish it to the public
[MCP Registry](https://github.com/modelcontextprotocol/registry)** so any MCP
client can discover and install it.

## `mcp/server.json`

```jsonc
{
  "name": "io.github.raristotle/meridian-product-finder",
  "version": "1.0.0",
  "repository": { … github … },
  "packages": [{
    "registryType": "npm",
    "identifier": "@wass/meridian-mcp-server",
    "transport": { "type": "stdio" },
    "environmentVariables": [
      { "name": "MERIDIAN_API_BASE",  … },
      { "name": "MERIDIAN_API_TOKEN", … }   // the WRITE_API_TOKEN for write tools
    ]
  }]
}
```

The descriptor follows the registry's `server.json` schema: a reverse-DNS `name`
namespaced to the GitHub owner, a version, the source repo, and one **npm**
package using the **stdio** transport with the two env vars a client must set.

## ⚠️ Before you publish

`@wass/meridian-mcp-server` is **not yet published to npm**. The registry verifies
the package exists, so publishing the registry entry **before** the npm package
will fail. Order of operations:

1. Publish the MCP server package to npm as `@wass/meridian-mcp-server`
   (the server code lives alongside the in-repo MCP server — package + `bin`).
2. Install the registry CLI and authenticate with GitHub
   (`mcp-publisher login github`).
3. From `mcp/`, run `mcp-publisher publish` against `server.json`.

Until step 1 is done, treat `mcp/server.json` as the **prepared, validated
descriptor** — committed and ready, publish is the external trigger.
