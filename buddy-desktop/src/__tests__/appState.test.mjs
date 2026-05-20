import test from "node:test";
import assert from "node:assert/strict";

import {
  connectionFromBuddyPayload,
  stateFromMascotEvent,
  stateWithInitialBuddy,
  stateWithRefreshedBuddy,
  stateWithReturnedBuddy,
} from "../utils/appState.mjs";

const TELEPORTED_BUDDY = {
  id: "terminal-buddy:TeleportAda",
  name: "TeleportAda",
  species: "Robot",
  rarity: "legendary",
  level: 7,
  xp: 45,
  xpToNext: 90,
  stats: {
    debugging: 44,
    patience: 12,
    chaos: 8,
    wisdom: 19,
    snark: 73,
  },
  personality: "Precise and direct.",
  mood: "teleported",
  asciiArt: ["[o_o]", "/|__|\\"],
  lastReaction: "Ready to move.",
  updatedAt: "2026-05-20T12:00:00.000Z",
};

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
    buddy: TELEPORTED_BUDDY,
  });

  assert.equal(state.connection, "online");
  assert.equal(state.animationState, "celebrate");
  assert.equal(state.buddy.id, "terminal-buddy:TeleportAda");
  assert.equal(state.buddy.name, "TeleportAda");
  assert.equal(state.buddy.species, "Robot");
  assert.equal(state.buddy.rarity, "legendary");
  assert.equal(state.buddy.level, 7);
  assert.equal(state.buddy.xp, 45);
  assert.equal(state.buddy.xpToNext, 90);
  assert.deepEqual(state.buddy.stats, TELEPORTED_BUDDY.stats);
  assert.equal(state.buddy.personality, "Precise and direct.");
  assert.deepEqual(state.buddy.asciiArt, ["[o_o]", "/|__|\\"]);
  assert.equal(state.buddy.lastReaction, "Ready to move.");
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

test("returned raw Buddy payload preserves terminal fine-grained identity fields", () => {
  const refreshed = stateWithRefreshedBuddy(undefined, TELEPORTED_BUDDY, "heart");
  const returned = stateWithReturnedBuddy(refreshed, {
    ...TELEPORTED_BUDDY,
    mood: "sleeping",
    lastReaction: "Desktop return recorded.",
  }, "Buddy returned to terminal.");

  assert.equal(returned.buddy.id, "terminal-buddy:TeleportAda");
  assert.equal(returned.buddy.name, "TeleportAda");
  assert.equal(returned.buddy.species, "Robot");
  assert.equal(returned.buddy.rarity, "legendary");
  assert.equal(returned.buddy.level, 7);
  assert.equal(returned.buddy.xp, 45);
  assert.equal(returned.buddy.xpToNext, 90);
  assert.deepEqual(returned.buddy.stats, TELEPORTED_BUDDY.stats);
  assert.equal(returned.buddy.personality, "Precise and direct.");
  assert.deepEqual(returned.buddy.asciiArt, ["[o_o]", "/|__|\\"]);
  assert.equal(returned.buddy.lastReaction, "Desktop return recorded.");
  assert.equal(returned.name, undefined);
  assert.equal(returned.stats, undefined);
  assert.equal(returned.connection, "offline");
  assert.equal(returned.animationState, "sleep");
  assert.equal(returned.errorMessage, "Buddy returned to terminal.");
});

test("returned mascot event payload preserves state wrapper without replacing Buddy details", () => {
  const returned = stateWithReturnedBuddy(undefined, {
    connection: "online",
    animationState: "celebrate",
    errorMessage: "event note",
    claudeSession: {
      status: "inactive",
      updatedAt: "2026-05-20T12:01:00.000Z",
    },
    buddy: {
      ...TELEPORTED_BUDDY,
      mood: "sleeping",
    },
  });

  assert.equal(returned.buddy.name, "TeleportAda");
  assert.equal(returned.buddy.level, 7);
  assert.deepEqual(returned.buddy.stats, TELEPORTED_BUDDY.stats);
  assert.equal(returned.buddy.personality, "Precise and direct.");
  assert.deepEqual(returned.buddy.asciiArt, ["[o_o]", "/|__|\\"]);
  assert.equal(returned.claudeSession.status, "inactive");
  assert.equal(returned.connection, "offline");
  assert.equal(returned.animationState, "sleep");
  assert.equal(returned.errorMessage, "event note");
});
