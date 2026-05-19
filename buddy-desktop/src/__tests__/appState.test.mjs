import test from "node:test";
import assert from "node:assert/strict";

import { connectionFromBuddyPayload } from "../utils/appState.mjs";

test("terminal Buddy payload mood controls desktop connection state", () => {
  assert.equal(connectionFromBuddyPayload({ mood: "teleported" }), "online");
  assert.equal(connectionFromBuddyPayload({ mood: "sleeping" }, "online"), "offline");
  assert.equal(connectionFromBuddyPayload({ mood: "focused" }, "online"), "online");
  assert.equal(connectionFromBuddyPayload(null), "offline");
});
