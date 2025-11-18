# @wafl-lang/cli

Global launcher for the WAFL command line interface. It delegates to `@wafl-lang/config`'s binary so you can run WAFL commands from anywhere.

## Install

- Global: `pnpm add -g @wafl-lang/cli` (or `npm i -g @wafl-lang/cli`)
- Ad‑hoc: `npx @wafl-lang/cli --help`

## Tests

- From repo root: `pnpm test --filter @wafl-lang/cli`
- Direct: `cd packages/cli && node --test`

## Usage

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

- `wafl build config/app.wafl --out=dist/app.json`
- `wafl validate config/app.wafl --env.NODE_ENV=production`

`@wafl-lang/cli` will locate the installed `@wafl-lang/config` package and forward the arguments to its CLI implementation.
