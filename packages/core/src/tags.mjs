/**
 * @fileoverview Custom tag handlers for WAFL documents.
 * Provides built-in tags like !rgb for color values and !file for file inclusion.
 */

import fs from "fs";
import path from "path";

/**
 * Registry of tag handler functions.
 * Each handler receives args, env, and ctx, and returns the processed value.
 */
const tagHandlers = {
  /**
   * RGB color tag handler.
   * Converts RGB values to CSS rgb() format.
   *
   * @param {string|Array} args - Comma-separated string or array of 3 numbers (r, g, b)
   * @returns {string} CSS rgb() color string
   * @throws {Error} If the arguments are not 3 valid numbers
   */
  rgb: (args) => {
    const parts = Array.isArray(args)
      ? args
      : String(args)
          .split(",")
          .map((x) => Number(x.trim()));

    if (parts.length !== 3 || parts.some(isNaN)) {
      throw new Error(`[WAFL:TAG] !rgb expects 3 numbers, got: ${args}`);
    }

    const [r, g, b] = parts;
    return `rgb(${r}, ${g}, ${b})`;
  },

  /**
   * File inclusion tag handler.
   * Reads and returns the contents of a file.
   *
   * @param {string} args - Path to the file (relative to baseDir or cwd)
   * @param {Object} env - Environment variables (unused)
   * @param {Object} ctx - Context object containing baseDir
   * @returns {string} The file contents as a string
   * @throws {Error} If the file cannot be read
   */
  file: (args, env, ctx) => {
    const filePath = path.resolve(ctx.baseDir || process.cwd(), String(args).trim());
    return fs.readFileSync(filePath, "utf8");
  },
};

/**
 * Executes a custom tag handler by name.
 *
 * @param {string} tagName - The name of the tag (without the ! prefix)
 * @param {*} args - Arguments passed to the tag
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Context object containing baseDir and other metadata
 * @returns {*} The result of the tag handler
 * @throws {Error} If the tag is not recognized
 */
export function runTag(tagName, args, env, ctx) {
  const fn = tagHandlers[tagName];
  if (!fn) throw new Error(`[WAFL:TAG] Unknown tag: !${tagName}`);
  return fn(args, env, ctx);
}
