import test from "node:test";
import assert from "node:assert/strict";

import {
  buddyVisualModel,
  clampNumber,
  compactText,
  dominantStat,
  isOfflineState,
  percent,
  statRows,
} from "../utils/stateHelpers.mjs";

test("percent clamps invalid and oversized values", () => {
  assert.equal(percent(25, 100), 25);
  assert.equal(percent(250, 100), 100);
  assert.equal(percent(1, 0), 0);
  assert.equal(percent(Number.NaN, 100), 0);
});

test("statRows returns stable clamped Buddy stats", () => {
  assert.deepEqual(statRows({ debugging: 120, patience: 42, snark: -5 }), [
    { key: "debugging", label: "Debugging", value: 100 },
    { key: "patience", label: "Patience", value: 42 },
    { key: "chaos", label: "Chaos", value: 0 },
    { key: "wisdom", label: "Wisdom", value: 0 },
    { key: "snark", label: "Snark", value: 0 },
  ]);
});

test("dominantStat and buddyVisualModel derive visual treatment without ascii art", () => {
  const stat = dominantStat({ debugging: 20, chaos: 88, snark: 40 });
  assert.deepEqual(stat, { key: "chaos", label: "Chaos", value: 88 });

  const visual = buddyVisualModel(
    { stats: { debugging: 20, chaos: 88, snark: 40 }, asciiArt: ["full terminal card is ignored"] },
    "online",
    "heart",
  );

  assert.equal(visual.topStat.key, "chaos");
  assert.equal(visual.expression, "heart");
  assert.match(visual.accent, /^#/);
});

test("text and offline helpers handle missing state", () => {
  assert.equal(compactText("  Bufo  "), "Bufo");
  assert.equal(compactText("", "Offline"), "Offline");
  assert.equal(isOfflineState(undefined), true);
  assert.equal(isOfflineState({ connection: "offline" }), true);
  assert.equal(isOfflineState({ connection: "online" }), false);
  assert.equal(clampNumber(Infinity, 0, 100), 0);
});
