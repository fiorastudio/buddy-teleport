import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MASCOT_STATE } from "../utils/stateDefaults.mjs";
import { buildStatusPopupViewModel } from "../utils/statusPopupViewModel.mjs";

test("offline state shows quiet title without Claude panel", () => {
  const view = buildStatusPopupViewModel(DEFAULT_MASCOT_STATE);

  assert.equal(view.title, "Quiet mode");
  assert.equal(view.isOffline, true);
  assert.equal(view.showClaudePanel, false);
  assert.equal(view.showPermissionPrompt, false);
});

test("active Claude session shows session panel", () => {
  const view = buildStatusPopupViewModel({
    ...DEFAULT_MASCOT_STATE,
    connection: "online",
    claudeSession: {
      status: "thinking",
      updatedAt: "2026-05-19T00:00:00.000Z",
    },
  });

  assert.equal(view.title, "Status");
  assert.equal(view.showClaudePanel, true);
});

test("pending prompt enables permission overlay", () => {
  const view = buildStatusPopupViewModel({
    ...DEFAULT_MASCOT_STATE,
    connection: "online",
    claudeSession: {
      status: "waiting-for-approval",
      pendingPrompt: {
        id: "req_1",
        tool: "Bash",
        hint: "npm test",
      },
      updatedAt: "2026-05-19T00:00:00.000Z",
    },
  });

  assert.equal(view.showPermissionPrompt, true);
  assert.equal(view.pendingPrompt.id, "req_1");
});
