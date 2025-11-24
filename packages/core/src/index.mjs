import { loadWaflFile } from "./loader.mjs";
import { resolveWafl } from "./resolver.mjs";
import { evaluateDocument } from "./eval.mjs";
import { validateDocument } from "./schema.mjs";
import { parseWaflString } from "./parser.mjs";

/**
 * Loads and processes an WAFL configuration file.
 *
 * This function orchestrates the complete configuration loading pipeline:
 * 1. Loads and parses the .wafl file
 * 2. Resolves tags, conditions, and expressions
 * 3. Evaluates dynamic content and embedded expressions
 * 4. Validates the result against the schema (if present)
 *
 * @param {string} filePath - Path to the .wafl configuration file
 * @param {object} [options] - Configuration options
 * @param {object} [options.env=process.env] - Environment variables for expression evaluation
 * @returns {Promise<object>} The fully resolved and validated configuration object
 * @throws {Error} If file not found, parsing fails, or validation errors occur
 */
export async function loadWaflConfig(filePath, { env = process.env } = {}) {
  const { doc, meta } = loadWaflFile(filePath);
  const resolved = resolveWafl(doc, { env });
  const evaluated = evaluateDocument(resolved, { env });
  validateDocument(evaluated, meta.schema);
  return evaluated;
}

/**
 * Loads and processes a WAFL configuration provided as a raw string.
 *
 * This mirrors the same pipeline as `loadWaflConfig` (parse -> resolve -> evaluate -> validate),
 * but skips filesystem access and @import resolution.
 *
 * @param {string} source - WAFL configuration source code
 * @param {object} [options] - Configuration options
 * @param {object} [options.env=process.env] - Environment variables for expression evaluation
 * @returns {Promise<object>} The fully resolved and validated configuration object
 */
export async function loadWaflConfigFromString(source, { env = process.env } = {}) {
  const parsed = parseWaflString(source, env);
  const meta = {
    imports: [],
    schema: null,
    evalBlock: null,
  };

  if (parsed["@import"]) {
    meta.imports = Array.isArray(parsed["@import"]) ? parsed["@import"] : [parsed["@import"]];
    delete parsed["@import"];
  }

  if (parsed["@schema"]) {
    meta.schema = parsed["@schema"];
    delete parsed["@schema"];
  }

  if (parsed["@eval"]) {
    meta.evalBlock = parsed["@eval"];
    delete parsed["@eval"];
  }

  const resolved = resolveWafl(parsed, { env });
  const evaluated = evaluateDocument(resolved, { env });
  validateDocument(evaluated, meta.schema);
  return evaluated;
}
