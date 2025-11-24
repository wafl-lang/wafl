# @wafl-lang/config
![NPM Downloads](https://img.shields.io/npm/d18m/%40wafl-lang%2Fconfig)

Loader and CLI for WAFL configuration files. Ships both a Node API (`loadConfig`) and a `wafl` CLI that parse, resolve, evaluate, and validate `.wafl` configs (imports, tags, expressions, and `@schema` blocks).

## Install

- Add to a project: `pnpm add @wafl-lang/config`
- Use the CLI without install: `npx @wafl-lang/config validate path/to/app.wafl`
- Globally (optional): `pnpm add -g @wafl-lang/config`

Requires Node 18+.

## CLI

```shell
wafl <command> [file] [options]

Commands:
  build <file>         Parse, resolve, evaluate, output final JSON
  validate <file>      Parse, resolve, and validate only

Options:
  --out=FILE           Write result JSON to file
  --env.KEY=value      Inject environment variable
  --quiet              Silence logs
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

What `loadConfig` does:

- Reads the `.wafl` file and its `@import` dependencies (relative paths supported).
- Extracts `@schema` metadata and validates the final document (throws on mismatch).
- Resolves tags (`!tag(args)`), conditions (`- if ...:`), and `$ENV` expressions.
- Evaluates inline expressions (e.g., `port = $ENV.PORT || 3000`) with `env` merged over `process.env`.

Errors surface as regular exceptions with context; wrap in `try/catch` if you want custom handling.

## Testing (in this repo)

- From repo root: `pnpm test --filter @wafl-lang/config`
- Direct: `cd packages/config && pnpm test`
