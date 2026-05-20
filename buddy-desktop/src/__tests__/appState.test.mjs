import test from "node:test";
import assert from "node:assert/strict";

import {
  connectionFromBuddyPayload,
  stateFromMascotEvent,
  stateWithInitialBuddy,
  stateWithRefreshedBuddy,
  stateWithReturnedBuddy,
} from "../utils/appState.mjs";

test("terminal Buddy payload mood controls desktop connection state", () => {
  assert.equal(connectionFromBuddyPayload({ mood: "teleported" }), "online");
  assert.equal(connectionFromBuddyPayload({ mood: "sleeping" }, "online"), "offline");
  assert.equal(connectionFromBuddyPayload({ mood: "focused" }, "online"), "online");
  assert.equal(connectionFromBuddyPayload(null), "offline");
});

test("mascot event state preserves terminal Buddy payload fields", () => {
  const state = stateFromMascotEvent({
    connection: "online",
    animationState: "celebrate",
    buddy: {
      id: "terminal-buddy:TeleportAda",
      name: "TeleportAda",
      species: "Robot",
      rarity: "legendary",
      level: 7,
      xp: 45,
      xpToNext: 90,
      personality: "Precise and direct.",
      mood: "teleported",
      asciiArt: ["[o_o]", "/|__|\\"],
    },
  });

  assert.equal(state.connection, "online");
  assert.equal(state.animationState, "celebrate");
  assert.equal(state.buddy.id, "terminal-buddy:TeleportAda");
  assert.equal(state.buddy.name, "TeleportAda");
  assert.equal(state.buddy.xp, 45);
  assert.deepEqual(state.buddy.asciiArt, ["[o_o]", "/|__|\\"]);
});

test("initial Buddy hydration derives connection and animation from terminal mood", () => {
  const onlineState = stateWithInitialBuddy(undefined, {
    id: "terminal-buddy:TeleportSmoke",
    name: "TeleportSmoke",
    mood: "teleported",
  });
  const offlineState = stateWithInitialBuddy(onlineState, {
    id: "terminal-buddy:TeleportSmoke",
    name: "TeleportSmoke",
    mood: "sleeping",
  });

  assert.equal(onlineState.buddy.name, "TeleportSmoke");
  assert.equal(onlineState.connection, "online");
  assert.equal(onlineState.animationState, "idle");
  assert.equal(offlineState.connection, "offline");
  assert.equal(offlineState.animationState, "sleep");
});

test("refreshed and returned Buddy state keep terminal identity while updating lifecycle", () => {
  const refreshed = stateWithRefreshedBuddy(undefined, {
    id: "terminal-buddy:TeleportAda",
    name: "TeleportAda",
    mood: "teleported",
  }, "heart");
  const returned = stateWithReturnedBuddy(refreshed, {
    id: "terminal-buddy:TeleportAda",
    name: "TeleportAda",
    mood: "sleeping",
  }, "Buddy returned to terminal.");

  assert.equal(refreshed.connection, "online");
  assert.equal(refreshed.animationState, "heart");
  assert.equal(returned.buddy.name, "TeleportAda");
  assert.equal(returned.name, undefined);
  assert.equal(returned.connection, "offline");
  assert.equal(returned.animationState, "sleep");
  assert.equal(returned.errorMessage, "Buddy returned to terminal.");
});
