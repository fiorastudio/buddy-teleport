export const DEFAULT_BUDDY_STATE = {
  id: "offline-buddy",
  name: "Buddy",
  species: "desktop companion",
  rarity: "common",
  level: 1,
  xp: 0,
  xpToNext: 100,
  stats: {
    debugging: 0,
    patience: 0,
    chaos: 0,
    wisdom: 0,
    snark: 0,
  },
  personality: "Quiet while offline.",
  mood: "sleeping",
  asciiArt: ["zZ", "(-.-)"],
  lastReaction: null,
  updatedAt: null,
};

export const DEFAULT_MASCOT_STATE = {
  connection: "offline",
  animationState: "sleep",
  buddy: DEFAULT_BUDDY_STATE,
  claudeSession: null,
  errorMessage: null,
};

export const DEFAULT_CLAUDE_SESSION_STATE = {
  status: "inactive",
  projectName: null,
  activeFile: null,
  lastPromptSummary: null,
  updatedAt: null,
};
