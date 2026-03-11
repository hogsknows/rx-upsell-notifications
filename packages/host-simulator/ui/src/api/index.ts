import type { GetMessagesResponse, Persona } from "../types/index.js";

export async function fetchPersonas(): Promise<Persona[]> {
  const res = await fetch("/api/personas");
  if (!res.ok) throw new Error("Failed to load personas");
  return res.json() as Promise<Persona[]>;
}

export async function getMessages(userId: string): Promise<GetMessagesResponse> {
  const res = await fetch(`/generator/api/messages?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to get messages");
  return res.json() as Promise<GetMessagesResponse>;
}

export async function sendEvent(
  event: "dismiss" | "upgrade-request" | "disable",
  userId: string,
  messageId?: string
): Promise<void> {
  await fetch(`/generator/api/events/${event}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, messageId }),
  });
}

export async function resetUser(userId: string): Promise<void> {
  await fetch("/generator/api/events/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
