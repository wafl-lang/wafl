#!/usr/bin/env node
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Entry point for the global WAFL CLI.
 *
 * This script acts as a launcher that locates the internal CLI executable
 * of the '@wafl-lang/config' package and runs it with the same command-line arguments.
 * This indirection allows the CLI logic to be maintained within '@wafl-lang/config',
 * keeping the global CLI package lightweight and focused on delegation.
 */
async function main() {
  try {
    /**
     * Resolve the path to the internal CLI executable of '@wafl-lang/config'.
     *
     * We use import.meta.resolve to find the installed location of '@wafl-lang/config',
     * then navigate relative to that path to locate its 'bin/wafl.mjs' binary.
     * This approach ensures we execute the correct version of the internal CLI
     * corresponding to the installed '@wafl-lang/config' package and works for ESM-only exports.
     */
    const configEntry = await import.meta.resolve("@wafl-lang/config");
    const waflConfigBin = resolve(dirname(fileURLToPath(configEntry)), "../bin/wafl.mjs");

    // Verify that the resolved binary actually exists before attempting to execute it.
    if (!fs.existsSync(waflConfigBin)) {
      // If the binary is missing, log an error and exit with a failure code.
      console.error("[ERROR] Unable to find @wafl-lang/config binary");
      process.exit(1);
    }

    /**
     * Prepare to spawn a child Node.js process to run the internal CLI.
     *
     * We extract the current process arguments (skipping the first two which are
     * node executable and this script path) and pass them along to the internal CLI.
     * This preserves the command-line interface transparently for the end user.
     */
    const args = process.argv.slice(2);
    const node = process.argv[0];

    // Spawn the internal CLI as a child process, inheriting stdio for seamless output.
    const child = execFile(node, [waflConfigBin, ...args], {
      stdio: "inherit",
    });

    // When the child process exits, propagate its exit code to this process.
    child.on("exit", (code) => process.exit(code ?? 0));
  } catch (err) {
    // Catch any unexpected errors during resolution or execution and report them.
    console.error("[ERROR] WAFL CLI error:", err.message || err);
    // Exit with a distinct error code to indicate failure in the CLI launcher.
    process.exit(2);
  }
}

main();
