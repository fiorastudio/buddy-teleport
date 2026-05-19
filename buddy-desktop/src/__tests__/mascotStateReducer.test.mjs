import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MASCOT_STATE } from "../utils/stateDefaults.mjs";
import {
  computeAnimationState,
  normalizeClaudeHeartbeat,
  reduceMascotState,
} from "../utils/mascotStateReducer.mjs";

test("animation precedence favors attention over busy and buddy level-up", () => {
  assert.equal(computeAnimationState({
    buddyOnline: true,
    buddyLevelUp: true,
    claude: { connected: true, running: 1, waiting: 1 },
  }), "attention");
});

test("running Claude heartbeat produces busy state", () => {
  const state = reduceMascotState(DEFAULT_MASCOT_STATE, {
    type: "claude_heartbeat",
    heartbeat: {
      total: 2,
      running: 1,
      waiting: 0,
      msg: "working",
      entries: ["10:42 testing"],
      tokens_today: 42,
    },
  });

  assert.equal(state.animationState, "busy");
  assert.equal(state.claudeSession.connected, true);
  assert.equal(state.claudeSession.tokensToday, 42);
});

test("prompt heartbeat produces attention state and prompt details", () => {
  const claude = normalizeClaudeHeartbeat({
    total: 1,
    running: 0,
    waiting: 1,
    msg: "approve: Bash",
    entries: [],
    tokens_today: 9,
    prompt: { id: "req_abc123", tool: "Bash", hint: "echo ok" },
  });

  assert.equal(computeAnimationState({ claude }), "attention");
  assert.equal(claude.pendingPrompt.id, "req_abc123");
});

test("disconnected Claude falls back to Buddy-only state", () => {
  const state = reduceMascotState({
    ...DEFAULT_MASCOT_STATE,
    connection: "online",
    animationState: "busy",
  }, { type: "claude_disconnected" });

  assert.equal(state.animationState, "idle");
  assert.equal(state.claudeSession.connected, false);
});
