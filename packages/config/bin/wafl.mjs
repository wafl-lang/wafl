#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { loadConfig } from "../src/index.mjs";

/**
 * Parse CLI arguments
 */
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      args[k] = v === undefined ? true : v;
    } else args._.push(a);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  const file = args._[1] || "examples/app.config.wafl";

  if (!cmd || !["build", "validate"].includes(cmd)) {
    console.log(`
Usage: wafl <command> [file] [options]

Commands:
  build <file>         Parse, resolve, evaluate, output final JSON
  validate <file>      Parse, resolve, and validate only

Options:
  --out=FILE           Write result JSON to file
  --env.KEY=value      Inject environment variable
`);
    process.exit(0);
  }

  const env = { ...process.env };
  for (const [k, v] of Object.entries(args)) {
    if (k.startsWith("env.")) {
      const raw = v;
      if (raw === "true") env[k.slice(4)] = true;
      else if (raw === "false") env[k.slice(4)] = false;
      else if (typeof raw === "string" && raw.trim() !== "" && !Number.isNaN(Number(raw))) {
        env[k.slice(4)] = Number(raw);
      } else {
        env[k.slice(4)] = raw;
      }
    }
  }

  try {
    const config = await loadConfig(file, { env });

    if (cmd === "validate") {
      console.log("WAFL Success: Validation successful");
      return;
    }

    const json = JSON.stringify(config, null, 2);
    if (args.out) {
      await fs.writeFile(args.out, json);
      console.log(`📝 Wrote → ${path.resolve(args.out)}`);
    } else {
      console.log("\nFinal config:");
      console.log(json);
    }
  } catch (err) {
    console.error("WAFL Error:", err.message);
    process.exit(1);
  }
}

main();
