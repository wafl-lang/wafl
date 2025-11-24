import fs from "fs";
import path from "path";
import { loadWaflConfig } from "@wafl-lang/core";

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
  const config = await loadWaflConfig(absPath, { env });
  console.log("[WAFL CONFIG] Configuration loaded successfully.\n");
  return config;
}
