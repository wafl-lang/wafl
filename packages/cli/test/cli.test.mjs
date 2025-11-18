import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";

const binPath = path.join(process.cwd(), "bin", "wafl.mjs");

test("CLI validate succeeds on example config", (t) => {
  return new Promise((resolve, reject) => {
    execFile(
      "node",
      [binPath, "validate", "../config/examples/app.config.wafl", "--env.NODE_ENV=dev", "--env.PORT=1111"],
      { cwd: process.cwd() },
      (error, stdout, stderr) => {
        if (error) return reject(error);
        assert.equal(stderr.trim(), "");
        resolve();
      },
    );
  });
});
