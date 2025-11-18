import assert from "node:assert/strict";
import test from "node:test";
import { validateDocument } from "../src/schema.mjs";

test("validateDocument passes with type metadata", () => {
  const schema = {
    App: {
      name: "string",
      port: "int",
      "debug?": "boolean",
    },
  };

  const doc = { app: { name: "demo", port: 8080, debug: false } };
  const typeMetadata = { app: "App" };

  assert.equal(validateDocument(doc, schema, typeMetadata), true);
});

test("validateDocument throws on missing required field", () => {
  const schema = {
    App: {
      name: "string",
      port: "int",
    },
  };
  const doc = { app: { port: 8080 } };
  const typeMetadata = { app: "App" };

  assert.throws(() => validateDocument(doc, schema, typeMetadata), /Required field 'name'/);
});
