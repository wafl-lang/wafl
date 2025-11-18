# @wafl-lang/core

Core engine for the Wider Attribute Formatting Language (WAFL): parsing, resolving tags/expressions, evaluating documents, and validating against schemas.

## Install

Add to your project (workspace-aware): `pnpm add @wafl-lang/core`

## Tests

- From repo root: `pnpm test --filter @wafl-lang/core`
- Direct: `cd packages/core && node --test`

## Usage

```js
import { loadWaflConfig } from "@wafl-lang/core";

const result = await loadWaflConfig("config/app.wafl", {
  env: { NODE_ENV: "production" }, // overrides/extends process.env
});

// result holds the fully resolved, evaluated, and validated configuration object
```

### Lower-level APIs

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

`loadWaflFile` parses `.wafl` files, `resolveWafl` handles imports/tags/conditions, `evaluateDocument` runs `@eval` blocks and expressions, and `validateDocument` enforces schemas so you can plug these pieces into your own pipeline.
