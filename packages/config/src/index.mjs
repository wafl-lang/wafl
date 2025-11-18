import fs from "fs";
import path from "path";
import { loadWaflFile } from "@wafl-lang/core/loader.mjs";
import { evaluateDocument } from "@wafl-lang/core/eval.mjs";
import { resolveWafl } from "@wafl-lang/core/resolver.mjs";
import { validateDocument } from "@wafl-lang/core/schema.mjs";

/**
 * Loads and evaluates a .wafl configuration file.
 *
 * @param {string} filePath - Path to the .wafl config file
 * @param {object} [options]
 * @param {object} [options.env] - Environment variables
 * @returns {Promise<object>} Fully resolved config
 */
export async function loadConfig(filePath, { env = process.env } = {}) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Config file not found: ${absPath}`);
  }

  console.log(`[WAFL CONFIG] Loading ${absPath}`);

  // Step 1: Load and parse (imports + schema + eval)
  const { doc, meta } = loadWaflFile(absPath, { env });

  // Step 1.5: Extract type metadata from keys before resolution
  const typeMetadata = extractTypeMetadata(doc);

  // Step 2: Resolve tags, conditions, and expressions
  const resolved = resolveWafl(doc, { env });

  // Step 3: Evaluate @eval blocks and embedded expressions
  const evaluated = evaluateDocument(resolved, { env });

  // Step 4: Validate against schema
  const schema = meta.schema || evaluated["@schema"];
  if (schema) {
    console.log("[WAFL CONFIG] Validating schema...");
    validateDocument(evaluated, schema, typeMetadata);
  }

  console.log("[WAFL CONFIG] Configuration loaded successfully.\n");
  return evaluated;
}

/**
 * Extracts type metadata from document keys (e.g., app<App> -> {app: "App"})
 *
 * @param {object} doc - The document to extract type metadata from
 * @returns {object} Map of key names to their type annotations
 */
function extractTypeMetadata(doc) {
  const metadata = {};

  function walk(obj, path = "") {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

    for (const key of Object.keys(obj)) {
      const match = key.match(/^(.*)<([A-Za-z0-9_]+)>$/);
      if (match) {
        const baseKey = match[1] || key;
        const typeName = match[2];
        const fullPath = path ? `${path}.${baseKey}` : baseKey;
        metadata[fullPath] = typeName;
      }

      // Recurse into nested objects
      if (obj[key] && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        const nextPath = path ? `${path}.${key.replace(/<.*>$/, "")}` : key.replace(/<.*>$/, "");
        walk(obj[key], nextPath);
      }
    }
  }

  walk(doc);
  return metadata;
}
