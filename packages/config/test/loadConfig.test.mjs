import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { loadConfig } from "../src/index.mjs";

const examplesDir = path.join(process.cwd(), "examples");

test("loadConfig resolves imports, expressions, tags, and conditionals", async () => {
  const filePath = path.join(examplesDir, "app.config.wafl");
  const env = { PORT: 4242, NODE_ENV: "prod" };

  const result = await loadConfig(filePath, { env });

  assert.equal(result.app.name, "WAFL Demo");
  assert.equal(result.app.port, 4242);
  assert.equal(result.app.debug, false);
  assert.deepEqual(result.app.features, ["login", "analytics"]);
  assert.equal(result.app.theme.primary, "rgb(255, 200, 80)");
});
