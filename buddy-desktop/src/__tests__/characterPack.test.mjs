import assert from "node:assert/strict";
import test from "node:test";
import { validateManifest, validatePackPath } from "../utils/characterPack.mjs";

const VALID_MANIFEST = {
  name: "buddy-penguin",
  states: {
    sleep: "sleep.gif",
    idle: ["idle_0.gif", "idle_1.gif"],
    busy: "busy.gif",
    attention: "attention.gif",
    celebrate: "celebrate.gif",
    dizzy: "dizzy.gif",
    heart: "heart.gif",
  },
};

test("validates local character pack manifest", () => {
  assert.equal(validateManifest(VALID_MANIFEST).name, "buddy-penguin");
});

test("rejects invalid manifests and unsafe paths", () => {
  assert.throws(() => validateManifest({}), /manifest.name/);
  assert.throws(() => validatePackPath("../secret"), /traversal/);
  assert.throws(() => validatePackPath("/tmp/secret"), /relative/);
});
