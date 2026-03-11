import { useState, useEffect, useCallback } from "react";
import type { MessageDefinition } from "@uns/shared";
import { listMessages } from "../api/messagesApi.js";

export function useMessages(filters?: { status?: string; upgradePath?: string }) {
  const [messages, setMessages] = useState<MessageDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMessages(filters);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.upgradePath]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { messages, loading, error, refetch: fetch };
}
