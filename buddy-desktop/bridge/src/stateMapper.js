"use strict";

const STAT_NAMES = ["debugging", "patience", "chaos", "wisdom", "snark"];

function normalizeBuddyState(response) {
  const structured = findStructuredState(response);
  if (structured) {
    return success(coerceState(structured, "structured"));
  }

  const text = extractTextContent(response);
  if (text) {
    const parsed = parseStatCard(text);
    if (parsed.ok) {
      return parsed;
    }
    return error("unrecognized_status", parsed.error.message);
  }

  return error("unrecognized_status", "Buddy status response did not contain structured state or stat card text");
}

function parseStatCard(card) {
  const plainCard = stripAnsi(card);
  const raritySpecies = plainCard.match(/★+\s*([A-Z][A-Z0-9_-]*)\s+([A-Z][A-Z0-9_ -]*?)\s*\|/);
  const level = plainCard.match(/Lv\.?\s*(\d+)\s*[·-]\s*(\d+)\s*\/\s*(\d+)\s*XP/i);
  const name = extractName(plainCard);

  const stats = {};
  for (const stat of STAT_NAMES) {
    const pattern = new RegExp(`${stat.toUpperCase()}\\s+[█▓░#=.:-]+\\s+(\\d+)`, "i");
    const match = plainCard.match(pattern);
    if (match) {
      stats[stat] = Number(match[1]);
    }
  }

  if (!raritySpecies || !level || !name || STAT_NAMES.some((stat) => typeof stats[stat] !== "number")) {
    return error("parse_failed", "Stat card did not match the expected Buddy format");
  }

  return success({
    name,
    level: Number(level[1]),
    xp: Number(level[2]),
    xpToNext: Number(level[3]),
    stats,
    rarity: raritySpecies[1],
    species: raritySpecies[2].trim(),
    asciiArt: extractAsciiArt(plainCard),
    source: "stat_card",
  });
}

function findStructuredState(value) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidates = [
    value,
    value.result,
    value.structuredContent,
    value.result?.structuredContent,
    value.state,
    value.result?.state,
  ];

  for (const candidate of candidates) {
    if (looksLikeStructuredState(candidate)) {
      return candidate;
    }
  }

  const content = value.result?.content || value.content;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (looksLikeStructuredState(item)) {
        return item;
      }
      if (looksLikeStructuredState(item?.json)) {
        return item.json;
      }
      if (looksLikeStructuredState(item?.data)) {
        return item.data;
      }
    }
  }

  return undefined;
}

function looksLikeStructuredState(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.name === "string" &&
      Number.isFinite(Number(value.level)) &&
      Number.isFinite(Number(value.xp)) &&
      Number.isFinite(Number(value.xpToNext)) &&
      value.stats &&
      typeof value.stats === "object"
  );
}

function coerceState(value, source) {
  const stats = {};
  for (const stat of STAT_NAMES) {
    stats[stat] = Number(value.stats[stat]);
  }

  return {
    name: String(value.name),
    level: Number(value.level),
    xp: Number(value.xp),
    xpToNext: Number(value.xpToNext),
    stats,
    rarity: value.rarity ? String(value.rarity) : "",
    species: value.species ? String(value.species) : "",
    asciiArt: Array.isArray(value.asciiArt) ? value.asciiArt.map(String) : [],
    source,
  };
}

function extractTextContent(response) {
  if (typeof response === "string") {
    return response;
  }

  const content = response?.result?.content || response?.content;
  if (!Array.isArray(content)) {
    return undefined;
  }

  const textItem = content.find((item) => item?.type === "text" && typeof item.text === "string");
  return textItem?.text;
}

function extractName(card) {
  const lines = card.split(/\r?\n/);
  const firstStatIndex = lines.findIndex((line) => STAT_NAMES.some((stat) => line.toUpperCase().includes(stat.toUpperCase())));
  if (firstStatIndex < 0) {
    return undefined;
  }

  for (let index = firstStatIndex - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const inner = stripBorder(line).trim();
    if (
      !inner ||
      inner.includes("★") ||
      /^["']/.test(inner) ||
      /^Lv\./i.test(inner) ||
      /^[_'.-]+$/.test(inner)
    ) {
      continue;
    }
    return inner;
  }

  return undefined;
}

function extractAsciiArt(card) {
  return card
    .split(/\r?\n/)
    .map((line) => stripBorder(line).trimEnd())
    .filter((line) => line.length > 0);
}

function stripBorder(line) {
  return line.replace(/^\s*[|.'`]\s?/, "").replace(/\s?[|']\s*$/, "");
}

function stripAnsi(value) {
  return String(value).replace(/\u001b\[[0-9;]*m/g, "");
}

function success(state) {
  return { ok: true, state };
}

function error(code, message) {
  return { ok: false, error: { code, message } };
}

module.exports = {
  normalizeBuddyState,
  parseStatCard,
};
