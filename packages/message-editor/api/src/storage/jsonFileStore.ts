import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { MessageDefinition, MessageDefinitionInput } from "@uns/shared";
import type { MessageStore } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "../../data/messages.json");
const TMP_FILE = DATA_FILE + ".tmp";

// NOTE: This store is single-writer only — concurrent writes will corrupt data.
// Acceptable for a single-user admin tool. Replace with SQLite or Postgres for multi-user use.

async function readData(): Promise<MessageDefinition[]> {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as MessageDefinition[];
}

async function writeData(data: MessageDefinition[]): Promise<void> {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(TMP_FILE, JSON.stringify(data, null, 2), "utf-8");
  await rename(TMP_FILE, DATA_FILE);
}

export function createJsonFileStore(): MessageStore {
  return {
    async getAll(filters) {
      let data = await readData();
      if (filters?.status) {
        data = data.filter((m) => m.status === filters.status);
      }
      if (filters?.upgradePath) {
        data = data.filter((m) => m.upgradePath === filters.upgradePath);
      }
      return data;
    },

    async getById(id) {
      const data = await readData();
      return data.find((m) => m.id === id) ?? null;
    },

    async create(input) {
      const data = await readData();
      const now = new Date().toISOString();
      const message: MessageDefinition = {
        ...input,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      data.push(message);
      await writeData(data);
      return message;
    },

    async update(id, input) {
      const data = await readData();
      const index = data.findIndex((m) => m.id === id);
      if (index === -1) return null;
      const updated: MessageDefinition = {
        ...data[index],
        ...input,
        id,
        createdAt: data[index].createdAt,
        updatedAt: new Date().toISOString(),
      };
      data[index] = updated;
      await writeData(data);
      return updated;
    },

    async delete(id) {
      const data = await readData();
      const index = data.findIndex((m) => m.id === id);
      if (index === -1) return false;
      data.splice(index, 1);
      await writeData(data);
      return true;
    },
  };
}
