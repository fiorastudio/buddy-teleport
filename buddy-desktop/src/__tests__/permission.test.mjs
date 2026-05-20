import assert from "node:assert/strict";
import test from "node:test";
import { buildPermissionDecision, promptSummary } from "../utils/permission.mjs";

test("builds approve once permission decision", () => {
  assert.deepEqual(buildPermissionDecision({ id: " req_abc123 " }, "once"), {
    cmd: "permission",
    id: "req_abc123",
    decision: "once",
  });
});

test("builds deny permission decision", () => {
  assert.equal(buildPermissionDecision({ id: "req_abc123" }, "deny").decision, "deny");
});

test("rejects missing prompt id and invalid decisions", () => {
  assert.throws(() => buildPermissionDecision({}, "once"), /prompt id/);
  assert.throws(() => buildPermissionDecision({ id: "   " }, "once"), /prompt id/);
  assert.throws(() => buildPermissionDecision({ id: "x" }, "always"), /decision/);
});

test("summarizes prompt tool and hint", () => {
  assert.equal(promptSummary({ tool: "Bash", hint: "npm test" }), "Bash: npm test");
});
