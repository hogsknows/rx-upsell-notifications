import type { MessageDefinition, MessageDefinitionInput } from "@uns/shared";

export interface MessageStore {
  getAll(filters?: { status?: string; upgradePath?: string }): Promise<MessageDefinition[]>;
  getById(id: string): Promise<MessageDefinition | null>;
  create(input: MessageDefinitionInput): Promise<MessageDefinition>;
  update(id: string, input: Partial<MessageDefinitionInput>): Promise<MessageDefinition | null>;
  delete(id: string): Promise<boolean>;
}
