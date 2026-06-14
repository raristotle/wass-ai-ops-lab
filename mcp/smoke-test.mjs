// Smoke test: spawn the Meridian MCP server over stdio, list tools, call a few.
//   node mcp/smoke-test.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(here, "meridian-mcp-server.mjs")],
});
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));

const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content?.[0]?.text ?? "";
  console.log(`\n${name}(${JSON.stringify(args)}) →`, text.slice(0, 400));
};

await call("cross_reference", { partNumber: "FRN-R-30" });
await call("coverage_summary", {});
await call("search_products", { query: "20A breaker", limit: 2 });

await client.close();
process.exit(0);
