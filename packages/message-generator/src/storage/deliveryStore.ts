import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/delivery-state.json");
const TMP_FILE = DATA_FILE + ".tmp";

export interface UserDeliveryState {
  optedOut: boolean;
  /** IDs of messages that have been delivered to the user at least once */
  seenMessageIds: string[];
}

type DeliveryState = Record<string, UserDeliveryState>;

async function readState(): Promise<DeliveryState> {
  if (!existsSync(DATA_FILE)) return {};
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as DeliveryState;
}

async function writeState(state: DeliveryState): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(TMP_FILE, JSON.stringify(state, null, 2), "utf-8");
  await rename(TMP_FILE, DATA_FILE);
}

function emptyUserState(): UserDeliveryState {
  return { optedOut: false, seenMessageIds: [] };
}

export async function getUserState(userId: string): Promise<UserDeliveryState> {
  const state = await readState();
  return state[userId] ?? emptyUserState();
}

export async function markSeen(userId: string, messageIds: string[]): Promise<void> {
  const state = await readState();
  const user = state[userId] ?? emptyUserState();
  const merged = new Set([...user.seenMessageIds, ...messageIds]);
  state[userId] = { ...user, seenMessageIds: [...merged] };
  await writeState(state);
}

export async function optOut(userId: string): Promise<void> {
  const state = await readState();
  const user = state[userId] ?? emptyUserState();
  state[userId] = { ...user, optedOut: true };
  await writeState(state);
}

export async function resetUser(userId: string): Promise<void> {
  const state = await readState();
  delete state[userId];
  await writeState(state);
}

export async function resetAll(): Promise<void> {
  await writeState({});
}
