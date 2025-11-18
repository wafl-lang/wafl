import assert from "node:assert/strict";
import test from "node:test";
import { resolveWafl } from "../src/resolver.mjs";

test("resolveWafl evaluates expressions, tags, conditionals, and inline $ENV", () => {
  const node = {
    count: { __expr: "1 + 2" },
    color: { __tag: "rgb", args: ["10", "20", "30"] },
    list: [
      { __if: "$ENV.ENABLED", value: 1 },
      { __if: "$ENV.MISSING", value: 2 },
      3,
    ],
    inline: "$ENV.VALUE || 0",
  };

  const resolved = resolveWafl(node, {
    env: { ENABLED: true, VALUE: 5 },
    ctx: {},
  });

  assert.equal(resolved.count, 3);
  assert.equal(resolved.color, "rgb(10, 20, 30)");
  assert.deepEqual(resolved.list, [1, 3]);
  assert.equal(resolved.inline, 5);
});
