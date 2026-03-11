import type { MessageStore } from "../storage/index.js";
import type { MessageDefinition, MessageDefinitionInput } from "@uns/shared";

export function createMessageService(store: MessageStore) {
  return {
    list(filters?: { status?: string; upgradePath?: string }): Promise<MessageDefinition[]> {
      return store.getAll(filters);
    },

    get(id: string): Promise<MessageDefinition | null> {
      return store.getById(id);
    },

    create(input: MessageDefinitionInput): Promise<MessageDefinition> {
      return store.create(input);
    },

    update(id: string, input: Partial<MessageDefinitionInput>): Promise<MessageDefinition | null> {
      return store.update(id, input);
    },

    remove(id: string): Promise<boolean> {
      return store.delete(id);
    },
  };
}
