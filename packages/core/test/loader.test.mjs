import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadWaflFile } from "../src/loader.mjs";

test("loadWaflFile merges imports and extracts metadata", () => {
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "wafl-loader-"));
  const basePath = path.join(tmpDir, "base.wafl");
  const entryPath = path.join(tmpDir, "entry.wafl");

  writeFileSync(
    basePath,
    [
      "@schema:",
      "  App:",
      "    name: string",
      "    port: int",
      "base: true",
      "",
    ].join("\n"),
    "utf8",
  );

  writeFileSync(
    entryPath,
    [
      "@import: base.wafl",
      "",
      "app<App>:",
      '  name: "Demo"',
      "  port = $ENV.PORT || 3000",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    const { doc, meta } = loadWaflFile(entryPath, { env: { PORT: 4242 } });

    assert.equal(meta.imports.length, 1);
    assert.ok(meta.imports[0].endsWith("base.wafl"), "import path should include base.wafl");
    assert.ok(meta.schema?.App, "schema should be extracted");
    assert.equal(doc.base, true, "imported fields merged into entry document");
    assert.equal(doc["app<App>"].name, "Demo");
    assert.equal(doc["app<App>"].port, 4242);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
