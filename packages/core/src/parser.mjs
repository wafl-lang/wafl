/**
 * @fileoverview Native WAFL parser that handles indentation, expressions (=expr),
 * tags (!tag), conditionals (if), and nested sections.
 */

import { Parser } from 'expr-eval';

/**
 * Parses an WAFL configuration string into a structured object.
 *
 * This parser handles:
 * - Indentation-based structure
 * - Expressions (key = expression)
 * - Tags (!tagName(args))
 * - Conditionals (if conditions)
 * - Nested sections (key:)
 * - Lists (- item)
 *
 * @param {string} source - The WAFL configuration source code
 * @param {object} [env={}] - Environment variables for expression evaluation
 * @returns {object} Parsed and evaluated configuration object
 */
export function parseWaflString(source, env = {}) {
    const lines = source
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.trimStart().startsWith("#") && !l.startsWith("%") && !l.startsWith("---"));

    const root = {};
    const stack = [{ indent: -1, target: root }];

    for (let raw of lines) {
        const indent = raw.match(/^\s*/)[0].length;
        const line = raw.trimEnd();

        // Pop stack only when decreasing indentation level
        while (indent < stack.at(-1).indent) stack.pop();
        const currentFrame = stack.at(-1);
        const current = currentFrame.target;

        const { key, value, isSection, isList, condition } = parseLine(line);
        if (!key && !isSection && !isList) continue;

        // --- SECTION ---
        if (isSection) {
            current[key] = {};
            stack.push({ indent: indent + 1, target: current[key] });
            continue;
        }

        // --- LIST ---
        if (isList) {
            // If condition is an __expr object, keep it for later evaluation
            const item = condition ? { __if: condition, value } : value;
            if (Array.isArray(current)) {
                current.push(item);
            } else {
                // Find the last key of the parent to attach the list
                const keys = Object.keys(current);
                const lastKey = keys[keys.length - 1];
                if (lastKey && typeof current[lastKey] === "object" && !Array.isArray(current[lastKey])) {
                    if (!Array.isArray(current[lastKey]._list)) current[lastKey]._list = [];
                    current[lastKey]._list.push(item);
                } else {
                    if (!Array.isArray(current._list)) current._list = [];
                    current._list.push(item);
                }
            }
            continue;
        }

        // --- KEY/VALUE ---
        current[key] = value;
    }

    /**
     * Converts temporary _list properties to actual arrays.
     *
     * @param {object} obj - Object to process
     * @returns {object|Array} Processed object or array
     */
    function fixLists(obj) {
        for (const [k, v] of Object.entries(obj)) {
            if (v && typeof v === "object") obj[k] = fixLists(v);
        }
        if (obj._list) {
            const arr = obj._list;
            delete obj._list;
            return arr;
        }
        return obj;
    }

    const parsed = fixLists(root);

    // Evaluate expressions, tags, and conditions
    return evaluate(parsed, env);
}

/**
 * Parses a single line to extract key, value, and metadata.
 *
 * @param {string} line - Line to parse
 * @returns {object} Parsed line information
 */
function parseLine(line) {
    // --- SECTION ---
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith(":") && !trimmedLine.includes("=") && !/^-\s/.test(trimmedLine)) {
        const colonMatch = trimmedLine.match(/^([^:]+):$/);
        if (colonMatch) {
            return { key: colonMatch[1].trim(), isSection: true };
        }
    }

    // --- LIST ---
    const listMatch = trimmedLine.match(/^-\s+(.*)$/);
    if (listMatch) {
        const content = listMatch[1].trim();
        const matchIf = content.match(/^if\s+(.+?):\s*(.*)$/);

        if (matchIf) {
            const condition = matchIf[1].trim();
            const val = matchIf[2].trim();
            // Store the condition as an expression to evaluate later
            return { isList: true, condition: { __expr: condition }, value: interpretValue(val) };
        }

        return { isList: true, value: interpretValue(content) };
    }

    // --- KEY / VALUE ---
    const matchEqual = line.match(/^([^:=]+)\s*=\s*(.*)$/);
    if (matchEqual) {
        const key = matchEqual[1].trim();
        let value = matchEqual[2].trim();

        // If the value starts with !, it's a tag, not an expression
        if (value.startsWith("!")) {
            return { key, value: interpretValue(value) };
        }

        // Otherwise, it's an expression
        return { key, value: { __expr: value } };
    }

    const matchColon = line.match(/^([^:=]+)\s*:\s*(.*)$/);
    if (matchColon) {
        const key = matchColon[1].trim();
        let value = matchColon[2].trim();
        return { key, value: interpretValue(value) };
    }

    return {};
}

/**
 * Interprets a raw value and converts it to the appropriate type.
 *
 * @param {string} raw - Raw value to interpret
 * @returns {*} Interpreted value (boolean, number, string, tag object, etc.)
 */
function interpretValue(raw) {
    if (!raw) return null;
    if (typeof raw !== "string") return raw;
    const trimmed = raw.trim();

    if (trimmed === "true") return true;
    if (trimmed === "false") return false;
    if (!isNaN(Number(trimmed))) return Number(trimmed);

    if (trimmed.startsWith("!")) {
        const match = trimmed.match(/^!(\w+)\((.*)\)$/);
        if (match) {
            const tag = match[1];
            const args = match[2]
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
            return { __tag: tag, args };
        }
    }

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }

    return trimmed;
}

/**
 * Evaluates expressions, tags, and conditions in the parsed structure.
 *
 * @param {*} obj - Object, array, or value to evaluate
 * @param {object} env - Environment variables for expression evaluation
 * @returns {*} Evaluated result
 */
function evaluate(obj, env) {
    if (Array.isArray(obj)) {
        const result = [];
        for (const item of obj) {
            if (item && typeof item === 'object' && item.__if) {
                // Evaluate the condition (can be an __expr object)
                const conditionValue = evaluate(item.__if, env);
                if (conditionValue) {
                    result.push(evaluate(item.value, env));
                }
            } else {
                result.push(evaluate(item, env));
            }
        }
        return result;
    }

    if (obj && typeof obj === 'object') {
        // Expression
        if (obj.__expr) {
            return evaluateExpression(obj.__expr, env);
        }

        // Tag
        if (obj.__tag) {
            return evaluateTag(obj.__tag, obj.args, env);
        }

        // Regular object
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = evaluate(value, env);
        }
        return result;
    }

    return obj;
}

/**
 * Evaluates a string expression with environment variables.
 *
 * @param {string} expr - Expression to evaluate
 * @param {object} env - Environment variables
 * @returns {*} Evaluated expression result
 */
function evaluateExpression(expr, env) {
    try {
        // Handle special case of $ENV.X || default directly
        const fallbackMatch = expr.match(/^\$ENV\.(\w+)\s*\|\|\s*(.+)$/);
        if (fallbackMatch) {
            const [, key, defaultValue] = fallbackMatch;
            const envValue = env[key];
            if (envValue !== undefined && envValue !== null && envValue !== '') {
                if (typeof envValue === 'string') return envValue;
                return envValue;
            }
            // Evaluate the default value
            const parser = new Parser();
            try {
                return parser.evaluate(defaultValue);
            } catch {
                return defaultValue; // If it's not an expression, return as is
            }
        }

        const parser = new Parser();

        // Detect environment variables
        const envVars = {};
        let normalizedExpr = expr.replace(/\$ENV\.(\w+)/g, (match, key) => {
            const value = env[key];
            if (value === undefined || value === null) {
                // Use a variable with a null value defined
                const varName = `_env_${key}`;
                envVars[varName] = null;
                return varName;
            }
            if (typeof value === 'string') return `"${value}"`;
            return String(value);
        });

        // Replace === with == and !== with !=
        normalizedExpr = normalizedExpr.replace(/===/g, '==').replace(/!==/g, '!=');

        // Replace && with and (expr-eval syntax)
        normalizedExpr = normalizedExpr.replace(/&&/g, ' and ');

        // Evaluate with environment variables
        return parser.evaluate(normalizedExpr, envVars);
    } catch (e) {
        console.error(`Expression evaluation error: ${expr}`, e);
        return null;
    }
}

/**
 * Evaluates a tag with its arguments.
 *
 * @param {string} tag - Tag name
 * @param {Array<string>} args - Tag arguments
 * @param {object} env - Environment variables
 * @returns {*} Evaluated tag result
 */
function evaluateTag(tag, args, env) {
    if (tag === 'rgb') {
        // Parse arguments (e.g., 255, 200, 80)
        const nums = args.map(a => parseInt(a, 10));
        return `rgb(${nums.join(', ')})`;
    }

    // Other tags to implement as needed
    return { __tag: tag, args };
}
