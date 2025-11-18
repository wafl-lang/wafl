/**
 * @fileoverview Resolver for WAFL documents that evaluates expressions, tags, and conditional blocks.
 * Processes $ENV expressions, custom tags, and __if conditional logic to produce the final resolved document.
 */

import { runTag } from "./tags.mjs";

/**
 * Resolves an WAFL document node by evaluating expressions, tags, and conditional blocks.
 *
 * @param {*} node - The node to resolve (can be any type)
 * @param {Object} [options={}] - Resolution options
 * @param {Object} [options.env=process.env] - Environment variables for expression evaluation
 * @param {Object} [options.ctx={}] - Context object containing baseDir and other metadata
 * @returns {*} The resolved node value
 */
export function resolveWafl(node, { env = process.env, ctx = {} } = {}) {
  return resolveNode(node, env, ctx);
}

/**
 * Internal recursive function to resolve a node.
 *
 * @param {*} node - The node to resolve
 * @param {Object} env - Environment variables
 * @param {Object} ctx - Context object
 * @returns {*} The resolved value
 */
function resolveNode(node, env, ctx) {
  // --- LISTS ---
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) {
      if (item && typeof item === "object" && item.__if) {
        if (safeEval(item.__if, env)) out.push(resolveNode(item.value, env, ctx));
        continue;
      }
      out.push(resolveNode(item, env, ctx));
    }
    return out;
  }

  // --- OBJECTS ---
  if (node && typeof node === "object") {
    // Expressions / Tags
    if (node.__expr) return safeEval(node.__expr, env);
    if (node.__tag) return runTag(node.__tag, node.args, env, ctx);

    // Internal lists (_list)
    if (node._list && Array.isArray(node._list)) {
      return node._list.map((item) => resolveNode(item, env, ctx));
    }

    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "_list") continue;
      if (typeof k === "string" && k.startsWith("- if")) continue;
      const cleanKey = typeof k === "string" ? k.replace(/<.*>$/, "") : k;
      out[cleanKey] = resolveNode(v, env, ctx);
    }

    return out;
  }

  // --- INLINE EXPRESSIONS ---
  if (typeof node === "string" && node.trim().startsWith("$ENV")) {
    return safeEval(node, env);
  }

  return node;
}

/**
 * Safely evaluates a JavaScript expression with access to environment variables.
 *
 * @param {string|*} expr - The expression to evaluate
 * @param {Object} env - Environment variables accessible as $ENV
 * @returns {*} The evaluated result, or the original expression if evaluation fails
 */
function safeEval(expr, env) {
  const $ENV = env;
  if (typeof expr !== "string") return expr;
  try {
    // eslint-disable-next-line no-new-func
    return new Function("$ENV", `return (${expr});`)($ENV);
  } catch (err) {
    console.warn("[WARN] WAFL eval failed:", expr, "-", err.message);
    return expr;
  }
}
