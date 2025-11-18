/**
 * @fileoverview Loader for .wafl files with support for imports, schema extraction, and eval blocks.
 * Handles recursive @import directives, extracts @schema and @eval metadata, and returns the merged document.
 */

import fs from "fs";
import path from "path";
import { parseWaflString } from "./parser.mjs";
import { deepMerge } from "./utils.mjs";

const HEADER = /^%WAFL\s+0\.\d+\s*$/;

/**
 * Loads a .wafl file, processes @import directives, extracts @schema/@eval blocks, and returns the merged document with metadata.
 *
 * @param {string} entryPath - Path to the entry .wafl file (relative or absolute)
 * @param {Object} [options={}] - Configuration options
 * @param {Object} [options.env] - Environment variables to use during parsing
 * @returns {{doc: Object, meta: {imports: string[], schema: Object|null, evalBlock: Object|null, baseDir: string}}} The merged document and extracted metadata
 * @throws {Error} If the WAFL header is invalid or file cannot be read
 */
export function loadWaflFile(entryPath, options = {}) {
  const absEntry = path.resolve(entryPath);
  const baseDir = path.dirname(absEntry);
  const visited = new Set();

  /**
   * Recursively loads a single .wafl file and its imports.
   *
   * @param {string} relOrAbsPath - Relative or absolute path to the file
   * @returns {{doc: Object, meta: Object}} The loaded document and metadata
   */
  function loadOne(relOrAbsPath) {
    const abs = path.isAbsolute(relOrAbsPath) ? relOrAbsPath : path.resolve(baseDir, relOrAbsPath);

    if (visited.has(abs)) return { doc: {}, meta: {} };
    visited.add(abs);

    const src = fs.readFileSync(abs, "utf8");
    const lines = src.split(/\r?\n/);

    // Optional WAFL header (if present, must match %WAFL 0.x)
    if (lines[0] && lines[0].startsWith("%WAFL") && !HEADER.test(lines[0])) {
      throw new Error(`Invalid WAFL header: ${lines[0]}`);
    }

    // Parse native .wafl format to raw AST
    const parsed = parseWaflString(src, options.env || {});

    // Extract special directives
    const meta = {
      imports: [],
      schema: null,
      evalBlock: null,
      baseDir: path.dirname(abs),
    };

    // @import (string or array)
    if (parsed["@import"]) {
      meta.imports = Array.isArray(parsed["@import"]) ? parsed["@import"] : [parsed["@import"]];
      delete parsed["@import"];
    }

    // @schema (object)
    if (parsed["@schema"]) {
      meta.schema = parsed["@schema"];
      delete parsed["@schema"];
    }

    // @eval (object)
    if (parsed["@eval"]) {
      meta.evalBlock = parsed["@eval"];
      delete parsed["@eval"];
    }

    // Recursively load imports and merge
    let merged = {};
    for (const imp of meta.imports) {
      const imported = loadOne(path.resolve(path.dirname(abs), imp));
      merged = deepMerge(merged, imported.doc);
      // Inherit schema if not present locally
      if (!meta.schema && imported.meta?.schema) meta.schema = imported.meta.schema;
      // Simple merge of evalBlocks (last one overwrites)
      if (!meta.evalBlock && imported.meta?.evalBlock) meta.evalBlock = imported.meta.evalBlock;
    }

    // Current file overwrites imports
    merged = deepMerge(merged, parsed);
    return { doc: merged, meta };
  }

  const { doc, meta } = loadOne(absEntry);
  return { doc, meta: { ...meta, baseDir } };
}
