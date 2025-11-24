import assert from "node:assert/strict";
import test from "node:test";
import { loadWaflConfigFromString } from "../src/index.mjs";

test("loadWaflConfigFromString parses, evaluates, and validates WAFL source", async () => {
  const source = [
    "@schema:",
    "  App:",
    "    name: string",
    "    port: int",
    "",
    "app<App>:",
    '  name: "Demo"',
    "  port = $ENV.PORT || 3000",
    "  features:",
    "    - auth",
    "",
  ].join("\n");

  const result = await loadWaflConfigFromString(source, { env: { PORT: 4242 } });

  assert.deepEqual(result, {
    app: {
      name: "Demo",
      port: 4242,
      features: ["auth"],
    },
  });
});
