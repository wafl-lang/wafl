# @wafl-lang/core

![NPM Downloads](https://img.shields.io/npm/d18m/%40wafl-lang%2Fcore)

Core engine for the Wider Attribute Formatting Language (WAFL): parsing, resolving tags/expressions, evaluating documents, and validating against schemas.

## Install

Add to a project: `pnpm add @wafl-lang/core` (Node 18+)

## High-level usage

```js
import { loadWaflConfig } from "@wafl-lang/core";

const result = await loadWaflConfig("config/app.wafl", {
  env: { NODE_ENV: "production" }, // overrides/extends process.env
});

// result holds the fully resolved, evaluated, and validated configuration object
```

### Load from a string (no filesystem)

```js
import { loadWaflConfigFromString } from "@wafl-lang/core";

const source = `
@schema:
  App:
    name: string
    port: int

app<App>:
  name: "Demo"
  port = $ENV.PORT || 3000
`;

const result = await loadWaflConfigFromString(source, { env: { PORT: 4242 } });
// => { app: { name: "Demo", port: 4242 } }
```

## Lower-level APIs

If you need finer control, import specific modules:

```js
import { loadWaflFile } from "@wafl-lang/core/loader.mjs";
import { resolveWafl } from "@wafl-lang/core/resolver.mjs";
import { evaluateDocument } from "@wafl-lang/core/eval.mjs";
import { validateDocument } from "@wafl-lang/core/schema.mjs";

const { doc, meta } = loadWaflFile("config/app.wafl");
const resolved = resolveWafl(doc, { env: process.env });
const evaluated = evaluateDocument(resolved, { env: process.env });
validateDocument(evaluated, meta.schema);
```

`loadWaflFile` parses `.wafl` files (and `@import`s), `resolveWafl` handles tags/conditions/expressions, `evaluateDocument` runs `@eval` blocks and expressions, and `validateDocument` enforces schemas so you can plug these pieces into your own pipeline.

## What’s included

- Parser for indentation-based `.wafl` syntax with tags (`!tag(args)`), lists, and expressions (`key = expr`).
- Resolver/evaluator for `$ENV` expressions, conditionals (`- if ...`), and custom tags.
- Schema validation via `@schema` blocks; supports optional fields (`field?`) and typed lists (`list<string>`).
- Type metadata extraction from keys like `app<App>` to enforce validation on the right paths.

## Testing (in this repo)

- From repo root: `pnpm test --filter @wafl-lang/core`
- Direct: `cd packages/core && pnpm test`
