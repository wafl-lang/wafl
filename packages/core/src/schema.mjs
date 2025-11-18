/**
 * @fileoverview Schema validator for WAFL documents.
 * Validates document structure against type definitions specified in @schema blocks.
 */

import { isPlainObject } from "./utils.mjs";

/**
 * Validates an WAFL document against its schema definition.
 *
 * @param {Object} doc - The document to validate
 * @param {Object} [schemaRoot=doc["@schema"]] - The schema definition (defaults to doc's @schema)
 * @param {Object} [typeMetadata={}] - Map of key paths to their type annotations
 * @returns {boolean} True if validation succeeds
 * @throws {Error} If validation fails with details about the mismatch
 */
export function validateDocument(doc, schemaRoot = doc["@schema"], typeMetadata = {}) {
  if (!schemaRoot) return true;

  console.log("[WAFL] Starting schema validation...");
  console.log("[WAFL] Type metadata:", JSON.stringify(typeMetadata, null, 2));
  console.log("[WAFL] Schema root:", JSON.stringify(schemaRoot, null, 2));

  /**
   * Resolves a type specification into a normalized type object.
   *
   * @param {string|Object} t - The type specification
   * @returns {{kind: string, of?: Object, fields?: Object}} The resolved type object
   * @throws {Error} If the type specification is invalid
   */
  const resolveType = (t) => {
    if (typeof t === "string") {
      const mList = t.match(/^list<(.+)>$/);
      if (mList) return { kind: "list", of: resolveType(mList[1]) };
      return { kind: t };
    }
    if (isPlainObject(t)) return { kind: "object", fields: t };
    throw new Error(`Invalid schema type: ${t}`);
  };

  /**
   * Checks if a field name indicates an optional field (ends with '?').
   *
   * @param {string} fieldName - The field name to check
   * @returns {{name: string, optional: boolean}} The normalized field name and optionality
   */
  const parseFieldName = (fieldName) => {
    if (fieldName.endsWith("?")) {
      return { name: fieldName.slice(0, -1), optional: true };
    }
    return { name: fieldName, optional: false };
  };

  /**
   * Asserts that a value matches the expected type.
   *
   * @param {string} path - The path to the value being validated (for error messages)
   * @param {*} val - The value to validate
   * @param {Object} type - The expected type object
   * @throws {Error} If the value doesn't match the expected type
   */
  const assertType = (path, val, type) => {
    console.log(`[WAFL] Validating ${path} of type ${type.kind}`);

    switch (type.kind) {
      case "string":
        if (typeof val !== "string") fail(path, "string", val);
        break;
      case "int":
      case "number":
        if (typeof val !== "number") fail(path, type.kind, val);
        break;
      case "bool":
      case "boolean":
        if (typeof val !== "boolean") fail(path, "boolean", val);
        break;
      case "list":
        if (!Array.isArray(val)) fail(path, "list", val);
        val.forEach((v, i) => assertType(`${path}[${i}]`, v, type.of));
        break;
      case "object":
        if (!isPlainObject(val)) fail(path, "object", val);

        console.log(`[WAFL] Checking object fields at ${path}:`, Object.keys(val));

        // Check all fields in the schema
        for (const [fieldNameWithOptional, spec] of Object.entries(type.fields)) {
          const { name: fieldName, optional } = parseFieldName(fieldNameWithOptional);
          const fieldValue = val[fieldName];

          console.log(`[WAFL] Field '${fieldName}' - required: ${!optional}, present: ${fieldValue !== undefined && fieldValue !== null}`);

          // If field is missing
          if (fieldValue === undefined || fieldValue === null) {
            if (!optional) {
              throw new Error(`[ERROR] Required field '${fieldName}' is missing at ${path}`);
            }
            continue; // Skip validation for optional missing fields
          }

          // Validate the field type
          assertType(`${path}.${fieldName}`, fieldValue, resolveType(spec));
        }
        break;
    }
  };

  /**
   * Throws an error indicating a type mismatch.
   *
   * @param {string} path - The path to the value
   * @param {string} expected - The expected type
   * @param {*} got - The actual value received
   * @throws {Error} Always throws with details about the type mismatch
   */
  const fail = (path, expected, got) => {
    throw new Error(`[ERROR] Expected ${expected} at ${path}, got ${typeof got}`);
  };

  // Use type metadata if provided (preferred method)
  if (Object.keys(typeMetadata).length > 0) {
    console.log("[WAFL] Using type metadata for validation");
    for (const [path, typeName] of Object.entries(typeMetadata)) {
      const spec = schemaRoot[typeName];
      if (!spec) {
        console.warn(`[WARN] [WAFL] Type '${typeName}' not found in schemaRoot`);
        continue;
      }

      console.log(`[WAFL] Validating path '${path}' with type '${typeName}'`);

      // Navigate to the value using the path
      const value = path.split('.').reduce((obj, key) => obj?.[key], doc);
      if (value === undefined) {
        console.warn(`[WARN] [WAFL] Value at path '${path}' not found in document`);
        continue;
      }

      assertType(path, value, resolveType(spec));
    }
  } else {
    // Fallback to old method (checking for <Type> in keys)
    console.log("[WAFL] No type metadata, falling back to key pattern matching");
    for (const [key, value] of Object.entries(doc)) {
      const m = key.match(/^(.*)<([A-Za-z0-9_]+)>$/);
      if (m) {
        const baseKey = m[1] || key;
        const typeName = m[2];
        const spec = schemaRoot[typeName];
        if (!spec) {
          console.warn(`[WARN] [WAFL] Type '${typeName}' not found in schemaRoot`);
          continue;
        }
        assertType(baseKey, value, resolveType(spec));
      }
    }
  }

  console.log("[WAFL] Schema validation successful.");
  return true;
}
