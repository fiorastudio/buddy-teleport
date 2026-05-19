"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { normalizeBuddyState, parseStatCard } = require("../src/stateMapper");

const fixtures = path.join(__dirname, "fixtures");

test("parses the current Buddy stat card fixture", () => {
  const card = fs.readFileSync(path.join(fixtures, "current-stat-card.txt"), "utf8");
  const expected = JSON.parse(fs.readFileSync(path.join(fixtures, "expected-state.json"), "utf8"));

  const result = parseStatCard(card);

  assert.equal(result.ok, true);
  assert.deepEqual(
    {
      ...result.state,
      asciiArt: undefined,
    },
    {
      ...expected,
      asciiArt: undefined,
    }
  );
  assert.ok(result.state.asciiArt.length > 0);
});

test("normalizes MCP text content containing a stat card", () => {
  const card = fs.readFileSync(path.join(fixtures, "current-stat-card.txt"), "utf8");

  const result = normalizeBuddyState({
    result: {
      content: [{ type: "text", text: card }],
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.state.name, "buddy");
  assert.equal(result.state.species, "PENGUIN");
});

test("parses the installed upstream Buddy card layout with sprite art", () => {
  const card = fs.readFileSync(path.join(fixtures, "upstream-rendered-stat-card.txt"), "utf8");

  const result = parseStatCard(`\u001b[36m${card}\u001b[0m`);

  assert.equal(result.ok, true);
  assert.equal(result.state.name, "Drift");
  assert.equal(result.state.rarity, "RARE");
  assert.equal(result.state.species, "VOID CAT");
  assert.equal(result.state.level, 3);
  assert.equal(result.state.xp, 4);
  assert.equal(result.state.xpToNext, 28);
  assert.equal(result.state.stats.wisdom, 88);
  assert.ok(result.state.asciiArt.some((line) => line.includes("\\______/")));
});

test("prefers structured Buddy state over fallback text", () => {
  const response = JSON.parse(fs.readFileSync(path.join(fixtures, "structured-response.json"), "utf8"));

  const result = normalizeBuddyState(response);

  assert.equal(result.ok, true);
  assert.equal(result.state.source, "structured");
  assert.equal(result.state.level, 2);
  assert.equal(result.state.species, "OWL");
});

test("returns an explicit error for unrecognized responses", () => {
  const result = normalizeBuddyState({ result: { content: [{ type: "text", text: "not a stat card" }] } });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "unrecognized_status");
});
