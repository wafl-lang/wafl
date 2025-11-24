# @wafl-lang/cli
![NPM Downloads](https://img.shields.io/npm/d18m/%40wafl-lang%2Fcli)

Global WAFL command line interface. Provides the `wafl` binary to parse, resolve, evaluate, and validate `.wafl` config files (imports, tags, expressions, `@schema`).

## Install

- Global: `pnpm add -g @wafl-lang/cli` (or `npm i -g @wafl-lang/cli`)
- Ad‑hoc: `npx @wafl-lang/cli --help`
- Required runtime: Node 18+

## Usage

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

- `wafl build config/app.wafl --out=dist/app.json`
- `wafl validate config/app.wafl --env.NODE_ENV=production`
- Use without install: `npx @wafl-lang/cli build examples/app.config.wafl`

If validation fails or a file is missing, the command exits non‑zero with an error message.

## Testing (in this repo)

- From repo root: `pnpm test --filter @wafl-lang/cli`
- Direct: `cd packages/cli && pnpm test`
