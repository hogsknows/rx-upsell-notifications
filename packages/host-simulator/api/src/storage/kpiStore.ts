import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { KpiCacheEntry, KpiCacheEntryInput } from "@uns/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/kpis.json");
const TMP_FILE = DATA_FILE + ".tmp";

// ---------------------------------------------------------------------------
// Simple async write-queue mutex — serialises all write operations so
// concurrent fire-and-forget requestKpi calls cannot interleave and corrupt
// the JSON file.
// ---------------------------------------------------------------------------
let writeQueue: Promise<void> = Promise.resolve();

function serialiseWrite<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(fn);
  // Swallow rejections on the queue chain so one failure doesn't block later writes
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function readData(): Promise<KpiCacheEntry[]> {
  if (!existsSync(DATA_FILE)) return [];
  const raw = await readFile(DATA_FILE, "utf-8");
  if (!raw.trim()) return [];
  return JSON.parse(raw) as KpiCacheEntry[];
}

async function writeData(data: KpiCacheEntry[]): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  await rename(TMP_FILE, DATA_FILE);
}

/** Natural key that identifies a unique KPI cache slot */
function sameSlot(a: KpiCacheEntry, b: KpiCacheEntryInput): boolean {
  return (
    a.tenantId === b.tenantId &&
    a.kpiName === b.kpiName &&
    a.userGroup === b.userGroup &&
    a.periodStart === b.periodStart &&
    a.periodEnd === b.periodEnd
  );
}

export interface KpiStoreFilters {
  tenantId?: string;
  entryType?: "value" | "requested";
}

export interface KpiStore {
  getAll(filters?: KpiStoreFilters): Promise<KpiCacheEntry[]>;
  getByTenant(tenantId: string): Promise<KpiCacheEntry[]>;
  /**
   * Insert or replace the entry matching the 5-part natural key
   * (tenantId, kpiName, userGroup, periodStart, periodEnd).
   * When promoting a "requested" entry to "value", requestedAt is preserved.
   */
  upsert(input: KpiCacheEntryInput): Promise<KpiCacheEntry>;
  delete(id: string): Promise<boolean>;
}

export function createKpiStore(): KpiStore {
  return {
    async getAll(filters) {
      let data = await readData();
      if (filters?.tenantId) {
        data = data.filter((e) => e.tenantId === filters.tenantId);
      }
      if (filters?.entryType) {
        data = data.filter((e) => e.entryType === filters.entryType);
      }
      return data;
    },

    async getByTenant(tenantId) {
      const data = await readData();
      return data.filter((e) => e.tenantId === tenantId);
    },

    upsert(input) {
      return serialiseWrite(async () => {
        const data = await readData();
        const existing = data.find((e) => sameSlot(e, input));

        const now = new Date().toISOString();

        if (existing) {
          // Promote "requested" → "value", preserving requestedAt for audit
          const updated: KpiCacheEntry = {
            ...existing,
            entryType: input.entryType,
            value: input.value,
            computedAt: input.entryType === "value" ? now : existing.computedAt,
            requestedAt:
              input.entryType === "requested"
                ? (existing.requestedAt ?? now) // don't overwrite earlier request time
                : existing.requestedAt,
          };
          data[data.indexOf(existing)] = updated;
          await writeData(data);
          return updated;
        }

        const entry: KpiCacheEntry = {
          ...input,
          id: randomUUID(),
          computedAt: input.entryType === "value" ? now : undefined,
          requestedAt: input.entryType === "requested" ? now : undefined,
        };
        data.push(entry);
        await writeData(data);
        return entry;
      });
    },

    delete(id) {
      return serialiseWrite(async () => {
        const data = await readData();
        const index = data.findIndex((e) => e.id === id);
        if (index === -1) return false;
        data.splice(index, 1);
        await writeData(data);
        return true;
      });
    },
  };
}
