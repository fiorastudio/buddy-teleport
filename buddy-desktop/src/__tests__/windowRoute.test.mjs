import test from "node:test";
import assert from "node:assert/strict";

import { routeForWindowSearch } from "../utils/windowRoute.mjs";

test("window route maps explicit status popup route to the real popup app", () => {
  assert.equal(routeForWindowSearch("?window=status-popup"), "status-popup");
  assert.equal(routeForWindowSearch("?window=status-popup&dev=1"), "status-popup");
});

test("window route keeps mascot separate from status popup", () => {
  assert.equal(routeForWindowSearch("?window=mascot&companion=buddy"), "mascot");
});

test("window route defaults to status popup for tray and browser verification", () => {
  assert.equal(routeForWindowSearch(""), "status-popup");
  assert.equal(routeForWindowSearch("?window=unknown"), "status-popup");
});
