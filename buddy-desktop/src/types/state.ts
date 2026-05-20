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
