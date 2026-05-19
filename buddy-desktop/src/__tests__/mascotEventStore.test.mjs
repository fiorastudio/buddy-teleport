import assert from "node:assert/strict";
import test from "node:test";
import { createMascotEventStore } from "../utils/mascotEventStore.mjs";

test("subscribers receive default and live mascot state updates", () => {
  const store = createMascotEventStore();
  const seen = [];
  const unsubscribe = store.subscribe((state) => seen.push(state));

  store.handleEvent("mascot-state-updated", {
    connection: "online",
    animationState: "idle",
    buddy: {
      name: "buddy",
      level: 3,
      xp: 8,
      xpToNext: 17,
    },
  });

  unsubscribe();

  assert.equal(seen[0].connection, "offline");
  assert.equal(seen[1].connection, "online");
  assert.equal(seen[1].buddy.name, "buddy");
  assert.equal(seen[1].buddy.stats.debugging, 0);
});

test("offline event keeps cached buddy state but switches to sleep", () => {
  const store = createMascotEventStore({
    connection: "online",
    animationState: "idle",
    buddy: { name: "buddy" },
  });

  store.handleEvent("bridge-offline", { message: "bridge exited" });

  assert.equal(store.getState().connection, "offline");
  assert.equal(store.getState().animationState, "sleep");
  assert.equal(store.getState().buddy.name, "buddy");
  assert.equal(store.getState().errorMessage, "bridge exited");
});
