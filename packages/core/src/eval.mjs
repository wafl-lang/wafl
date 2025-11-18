/**
 * @fileoverview Document evaluator for WAFL that processes expressions, tags, and conditional blocks.
 * Walks through the document tree evaluating __expr nodes, __tag nodes, and __if conditionals.
 */

import { runTag } from "./tags.mjs";

/**
 * Evaluates an WAFL document by walking the tree and processing special nodes.
 *
 * @param {Object} doc - The document to evaluate
 * @param {Object} [options={}] - Evaluation options
 * @param {Object} [options.env=process.env] - Environment variables for expression evaluation
 * @param {Object} [options.symbols={}] - Symbol table accessible as $ in expressions
 * @returns {Object} The evaluated document
 */
export function evaluateDocument(doc, { env = process.env, symbols = {} } = {}) {
  /**
   * Recursively walks the document tree and evaluates nodes.
   *
   * @param {*} node - The node to walk
   * @returns {*} The evaluated value
   */
  function walk(node) {
    if (Array.isArray(node)) {
      return node
        .map(walk)
        .filter((item) => {
          if (item && typeof item === "object" && item.__if) {
            try {
              return safeEval(item.__if, env, symbols);
            } catch {
              return false;
            }
          }
          return true;
        })
        .map((item) => (item && item.value !== undefined ? item.value : item));
    }

    if (node && typeof node === "object") {
      if (node.__if) return node;
      if (node.__expr) return safeEval(node.__expr, env, symbols);
      if (node.__tag) return runTag(node.__tag, node.args, env, { baseDir: process.cwd() });

      const out = {};
      for (const [k, v] of Object.entries(node)) out[k] = walk(v);
      return out;
    }

    return node;
  }

  return walk(doc);
}

/**
 * Safely evaluates a JavaScript expression with access to environment variables and symbols.
 *
 * @param {string|*} expr - The expression to evaluate
 * @param {Object} env - Environment variables accessible as $ENV
 * @param {Object} symbols - Symbol table accessible as $
 * @returns {*} The evaluated result, or the original expression if evaluation fails
 */
function safeEval(expr, env, symbols) {
  const $ENV = env;
  const $ = symbols;

  if (typeof expr !== "string") return expr;
  if (expr.includes(":")) return expr;

  try {
    // eslint-disable-next-line no-new-func
    return new Function("$ENV", "$", `return (${expr});`)($ENV, $);
  } catch (err) {
    console.warn("[WARN] [WAFL:EVAL] Failed to evaluate:", expr, "-", err.message);
    return expr;
  }
}
