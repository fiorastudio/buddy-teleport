export type AnimationState =
  | "sleep"
  | "idle"
  | "busy"
  | "attention"
  | "celebrate"
  | "dizzy"
  | "heart";

export type ConnectionState = "offline" | "connecting" | "online" | "error";

export interface BuddyStats {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

export interface BuddyState {
  id: string;
  name: string;
  species: string;
  rarity: string;
  level: number;
  xp: number;
  xpToNext: number;
  stats: BuddyStats;
  personality: string;
  mood: string;
  asciiArt: string[];
  lastReaction: string | null;
  updatedAt: string | null;
}

export interface ClaudeSessionState {
  connected?: boolean;
  total?: number;
  running?: number;
  waiting?: number;
  msg?: string;
  entries?: string[];
  tokensToday?: number;
  pendingPrompt?: {
    id: string;
    tool: string;
    hint: string;
  } | null;
  lastHeartbeatAt?: string | null;
  status?: "inactive" | "active" | "thinking" | "waiting-for-approval";
  projectName?: string | null;
  activeFile?: string | null;
  lastPromptSummary?: string | null;
  updatedAt: string | null;
}

export interface MascotState {
  connection: ConnectionState;
  animationState: AnimationState;
  buddy: BuddyState;
  claudeSession?: ClaudeSessionState | null;
  errorMessage?: string | null;
}

export const DEFAULT_BUDDY_STATE: BuddyState = {
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

export const DEFAULT_CLAUDE_SESSION_STATE: ClaudeSessionState = {
  status: "inactive",
  projectName: null,
  activeFile: null,
  lastPromptSummary: null,
  updatedAt: null,
};

export const DEFAULT_MASCOT_STATE: MascotState = {
  connection: "offline",
  animationState: "sleep",
  buddy: DEFAULT_BUDDY_STATE,
  claudeSession: null,
  errorMessage: null,
};
