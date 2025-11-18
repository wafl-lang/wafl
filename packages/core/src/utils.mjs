/**
 * @fileoverview Utility functions for WAFL core operations.
 * Provides helper functions for type checking and deep object merging.
 */

/**
 * Checks if a value is a plain JavaScript object (not an array, null, or other object type).
 *
 * @param {*} v - The value to check
 * @returns {boolean} True if v is a plain object with Object.prototype as its prototype
 */
export function isPlainObject(v) {
  return v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
}

/**
 * Recursively merges two values with intelligent handling of objects and arrays.
 * - For objects: recursively merges properties (b overwrites a)
 * - For arrays: concatenates both arrays
 * - For primitives: b overwrites a
 * - Undefined values are handled gracefully
 *
 * @param {*} a - The base value
 * @param {*} b - The value to merge in (takes precedence)
 * @returns {*} The merged result
 */
export function deepMerge(a, b) {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (isPlainObject(a) && isPlainObject(b)) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a[k], v);
    return out;
  }
  return b;
}
