import { useState } from "react";
import { Link } from "react-router-dom";
import { UPGRADE_PATHS } from "@uns/shared";
import { useMessages } from "../hooks/useMessages.js";
import { patchMessage, deleteMessage } from "../api/messagesApi.js";
import MessageList from "../components/MessageList.js";
import type { MessageDefinition } from "@uns/shared";
import "./ListPage.css";

export default function ListPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [pathFilter, setPathFilter] = useState("");

  const filters = {
    status: statusFilter || undefined,
    upgradePath: pathFilter || undefined,
  };

  const { messages, loading, error, refetch } = useMessages(filters);

  async function handleToggleStatus(id: string, current: MessageDefinition["status"]) {
    const next = current === "active" ? "inactive" : "active";
    try {
      await patchMessage(id, { status: next });
      refetch();
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete message "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMessage(id);
      refetch();
    } catch (err) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/messages/new" className="btn btn--primary">+ New Message</Link>
      </div>

      <div className="filter-bar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All upgrade paths</option>
          {UPGRADE_PATHS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {loading && <p className="state-message">Loading…</p>}
      {error && <p className="state-message state-message--error">Error: {error}</p>}
      {!loading && !error && (
        <MessageList
          messages={messages}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
