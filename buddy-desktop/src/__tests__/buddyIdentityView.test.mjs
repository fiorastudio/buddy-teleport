import test from "node:test";
import assert from "node:assert/strict";

import { buildBuddyIdentityView } from "../utils/buddyIdentityView.mjs";

test("buildBuddyIdentityView preserves terminal Buddy identity, XP, stats, and body", () => {
  const view = buildBuddyIdentityView({
    name: "TeleportAda",
    species: "Robot",
    rarity: "legendary",
    level: 7,
    xp: 45,
    xpToNext: 90,
    stats: {
      debugging: 74,
      patience: 32,
      chaos: 12,
      wisdom: 55,
      snark: 4,
    },
    asciiArt: ["", "  [o_o]  ", " /|___|\\ ", "  /   \\  ", ""],
    lastReaction: "TeleportAda observed from desktop.",
  });

  assert.equal(view.name, "TeleportAda");
  assert.equal(view.meta, "legendary Robot");
  assert.equal(view.levelLabel, "Lv. 7");
  assert.equal(view.xpAriaLabel, "XP 45 of 90");
  assert.equal(view.xpLabel, "45/90");
  assert.equal(view.xpPercent, 50);
  assert.deepEqual(view.topStat, { key: "debugging", label: "Debugging", value: 74 });
  assert.deepEqual(view.stats, [
    { key: "debugging", label: "Debugging", value: 74 },
    { key: "patience", label: "Patience", value: 32 },
    { key: "chaos", label: "Chaos", value: 12 },
    { key: "wisdom", label: "Wisdom", value: 55 },
    { key: "snark", label: "Snark", value: 4 },
  ]);
  assert.deepEqual(view.spriteFrames[0], ["  [o_o]  ", " /|___|\\ ", "  /   \\  "]);
  assert.equal(view.reaction, "TeleportAda observed from desktop.");
});
