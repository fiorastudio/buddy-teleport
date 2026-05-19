import { readFile } from "node:fs/promises";
import path from "node:path";

const REQUIRED_STATES = ["sleep", "idle", "busy", "attention", "celebrate", "dizzy", "heart"];

export function validatePackPath(relativePath) {
  if (!relativePath || typeof relativePath !== "string") {
    throw new Error("pack path must be a non-empty string");
  }
  if (path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new Error("pack path must be relative and must not contain traversal");
  }
  return relativePath;
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object") {
    throw new Error("manifest must be an object");
  }
  if (!manifest.name || typeof manifest.name !== "string") {
    throw new Error("manifest.name is required");
  }
  if (!manifest.states || typeof manifest.states !== "object") {
    throw new Error("manifest.states is required");
  }
  for (const state of REQUIRED_STATES) {
    const value = manifest.states[state];
    if (!value) {
      throw new Error(`manifest state missing: ${state}`);
    }
    const files = Array.isArray(value) ? value : [value];
    for (const file of files) {
      validatePackPath(file);
    }
  }
  return manifest;
}

export async function loadCharacterPack(manifestPath) {
  const text = await readFile(manifestPath, "utf8");
  return validateManifest(JSON.parse(text));
}
