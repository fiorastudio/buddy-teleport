export interface BuddyStats {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

export interface BuddyState {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  stats: BuddyStats;
  rarity: string;
  species: string;
  asciiArt: string[];
  source: "structured" | "stat_card";
}

export type BuddyStateResult =
  | { ok: true; state: BuddyState }
  | { ok: false; error: { code: string; message: string } };

export class McpClientError extends Error {
  code: string;
  cause?: unknown;
}

export class McpJsonRpcClient {
  constructor(options: { input: NodeJS.WritableStream; output: NodeJS.ReadableStream; timeoutMs?: number; clientInfo?: { name?: string; version?: string } });
  initialize(): Promise<unknown>;
  callTool(name: string, args?: Record<string, unknown>): Promise<unknown>;
  request(method: string, params?: Record<string, unknown>): Promise<unknown>;
  notify(method: string, params?: Record<string, unknown>): Promise<void>;
  close(): void;
}

export function normalizeBuddyState(response: unknown): BuddyStateResult;
export function parseStatCard(card: string): BuddyStateResult;
export function createMcpClient(options: ConstructorParameters<typeof McpJsonRpcClient>[0]): McpJsonRpcClient;
export function getBuddyState(client: { callTool(name: string, args?: Record<string, unknown>): Promise<unknown> }): Promise<BuddyStateResult>;
export function formatSidecarEvent(type: string, payload?: Record<string, unknown>): string;
export function formatBuddyStateEvent(state: BuddyState): string;
export function formatBridgeOfflineEvent(message?: string): string;
export function parseSidecarCommand(line: string):
  | { ok: true; command: { cmd: "call_tool"; requestId: string | null; name: string; args: Record<string, unknown> } }
  | { ok: false; error: { code: string; message: string } };
export function callBuddyTool(
  client: { callTool(name: string, args?: Record<string, unknown>): Promise<unknown> },
  name: string,
  args?: Record<string, unknown>,
  options?: { refreshState?: boolean }
): Promise<
  | { ok: true; result: unknown; state?: BuddyStateResult }
  | { ok: false; error: { code: string; message: string } }
>;
export function launchBuddyProcess(options: { command: string; args?: string[]; cwd?: string; env?: Record<string, string>; stdio?: unknown }): unknown;
export function createBuddyProcessLauncher(defaults?: Record<string, unknown>): (overrides?: Record<string, unknown>) => unknown;
export const SUPPORTED_TOOLS: Set<string>;
