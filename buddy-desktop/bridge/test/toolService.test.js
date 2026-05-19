"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { SUPPORTED_TOOLS, callBuddyTool } = require("../src/toolService");

const STATUS_CARD = `
.__________________________________________.
| ★ COMMON                         PENGUIN |
| buddy                                    |
| DEBUGGING  █░░░░░░░   14                 |
| PATIENCE   ▓░░░░░░░   11                 |
| CHAOS      ██░░░░░░   26                 |
| WISDOM     ░░░░░░░░    3                 |
| SNARK      ████▓░░░   59                 |
| Lv.1 · 3/17 XP to next                   |
'__________________________________________'
`;

test("rejects unsupported Buddy tool names before calling upstream", async () => {
  let called = false;
  const client = {
    async callTool() {
      called = true;
    },
  };

  const result = await callBuddyTool(client, "rm_everything", {});

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "unsupported_tool");
  assert.equal(called, false);
});

test("forwards supported tool calls and refreshes state", async () => {
  const calls = [];
  const client = {
    async callTool(name, args) {
      calls.push({ name, args });
      if (name === "buddy_status") {
        return { content: [{ type: "text", text: STATUS_CARD }] };
      }
      return { content: [{ type: "text", text: "pet reaction" }] };
    },
  };

  const result = await callBuddyTool(client, "buddy_pet", { intensity: 1 });

  assert.equal(result.ok, true);
  assert.deepEqual(calls.map((call) => call.name), ["buddy_pet", "buddy_status"]);
  assert.equal(result.state.ok, true);
  assert.equal(result.state.state.name, "buddy");
});

test("returns non-crashing error state when tool call fails", async () => {
  const client = {
    async callTool() {
      const error = new Error("boom");
      error.code = "rpc_error";
      throw error;
    },
  };

  const result = await callBuddyTool(client, "buddy_pet", {});

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "rpc_error");
  assert.match(result.error.message, /boom/);
});

test("tracks the installed upstream Buddy tool surface", () => {
  for (const toolName of [
    "buddy_status",
    "buddy_pet",
    "buddy_dream",
    "buddy_hatch",
    "buddy_mode",
    "buddy_observe",
    "buddy_remember",
    "buddy_respawn",
    "buddy_mute",
    "buddy_unmute",
    "buddy_forget",
    "buddy_reasoning_status",
    "buddy_share",
  ]) {
    assert.equal(SUPPORTED_TOOLS.has(toolName), true, toolName);
  }
});
