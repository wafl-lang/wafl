import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadWaflConfig } from "../src/index.mjs";

test("loadWaflConfig throws when schema validation fails", async () => {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "wafl-config-"));
  const configPath = path.join(tmpDir, "app.wafl");

  writeFileSync(
    configPath,
    [
      "@schema:",
      "  App:",
      "    name: string",
      "    port: int",
      "",
      "app<App>:",
      '  name: "Demo"',
      // port is intentionally missing
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    await assert.rejects(
      () => loadWaflConfig(configPath, { env: {} }),
      /Required field 'port'/,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
