# @wafl-lang/config

CLI and Node API for loading WAFL configuration files. It wraps the WAFL core engine with a user-friendly executable and helper utilities.

## Install

- Project dependency: `pnpm add @wafl-lang/config` (workspace uses `@wafl-lang/core` automatically)
- Global CLI via the launcher: `pnpm add -g @wafl-lang/cli` or run directly with `npx @wafl-lang/config`

## Tests

- From repo root: `pnpm test --filter @wafl-lang/config`
- Direct: `cd packages/config && node --test`

## CLI

```shell
wafl <command> [file] [options]

Commands:
  build <file>         Parse, resolve, evaluate, output final JSON
  validate <file>      Parse, resolve, and validate only

Options:
  --out=FILE           Write result JSON to file
  --env.KEY=value      Inject environment variable
```

Examples:

- Build and write JSON: `wafl build examples/app.config.wafl --out=tmp/app.json`
- Validate only with env vars: `wafl validate config/app.wafl --env.NODE_ENV=production`

## Node API

```js
import { loadConfig } from "@wafl-lang/config";

const config = await loadConfig("config/app.wafl", {
  env: { NODE_ENV: "production" }, // merged with process.env by default
});

// config now contains the fully resolved, evaluated, and validated JSON object
```

`loadConfig` resolves tags, evaluates expressions, and validates the document (using either inline `@schema` or referenced schema metadata). It throws if the file is missing or validation fails.
