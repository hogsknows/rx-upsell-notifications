import type { MessageDefinition, MessageDefinitionInput } from "@uns/shared";

const BASE = "/api/messages";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function listMessages(filters?: {
  status?: string;
  upgradePath?: string;
}): Promise<MessageDefinition[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.upgradePath) params.set("upgradePath", filters.upgradePath);
  const qs = params.toString();
  const res = await fetch(qs ? `${BASE}?${qs}` : BASE);
  return handleResponse(res);
}

export async function getMessage(id: string): Promise<MessageDefinition> {
  const res = await fetch(`${BASE}/${id}`);
  return handleResponse(res);
}

export async function createMessage(
  input: MessageDefinitionInput
): Promise<MessageDefinition> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function updateMessage(
  id: string,
  input: MessageDefinitionInput
): Promise<MessageDefinition> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function patchMessage(
  id: string,
  input: Partial<MessageDefinitionInput>
): Promise<MessageDefinition> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function deleteMessage(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  return handleResponse(res);
}
