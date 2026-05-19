"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  formatBridgeOfflineEvent,
  formatBuddyStateEvent,
  parseSidecarCommand,
} = require("../src/sidecarProtocol");
const { defaultBuddyArgs, formatSidecarToolResult } = require("../src/sidecar");

test("formats normalized Buddy state as a newline-delimited sidecar event", () => {
  const line = formatBuddyStateEvent({ name: "Drift", level: 3 });

  assert.equal(line.endsWith("\n"), true);
  assert.deepEqual(JSON.parse(line), {
    type: "buddy_state",
    buddy: {
      name: "Drift",
      level: 3,
    },
  });
});

test("formats bridge offline events for Rust shell consumption", () => {
  const event = JSON.parse(formatBridgeOfflineEvent("spawn failed"));

  assert.equal(event.type, "bridge_offline");
  assert.equal(event.message, "spawn failed");
});

test("parses call_tool commands from the Rust shell", () => {
  const result = parseSidecarCommand(JSON.stringify({
    cmd: "call_tool",
    requestId: "req-1",
    name: "buddy_pet",
    args: { intensity: 1 },
  }));

  assert.equal(result.ok, true);
  assert.deepEqual(result.command, {
    cmd: "call_tool",
    requestId: "req-1",
    name: "buddy_pet",
    args: { intensity: 1 },
  });
});

test("rejects invalid sidecar commands without throwing", () => {
  assert.equal(parseSidecarCommand("not-json").ok, false);
  assert.equal(parseSidecarCommand(JSON.stringify({ cmd: "launch" })).ok, false);
});

test("builds sidecar launch args from Buddy MCP entry env", () => {
  assert.deepEqual(defaultBuddyArgs({ BUDDY_MCP_ENTRY: "/tmp/buddy/dist/server/index.js" }), [
    "/tmp/buddy/dist/server/index.js",
  ]);
  assert.throws(() => defaultBuddyArgs({}), /BUDDY_MCP_ENTRY/);
});

test("formats sidecar tool results with request id", () => {
  const result = JSON.parse(formatSidecarToolResult("req-2", { ok: true, result: { content: [] } }));

  assert.equal(result.type, "tool_result");
  assert.equal(result.requestId, "req-2");
  assert.equal(result.ok, true);
});
