import { Link } from "react-router-dom";
import type { MessageDefinition } from "@uns/shared";
import StatusBadge from "./StatusBadge.js";
import "./MessageList.css";

interface Props {
  messages: MessageDefinition[];
  onToggleStatus: (id: string, currentStatus: MessageDefinition["status"]) => void;
  onDelete: (id: string, title: string) => void;
}

export default function MessageList({ messages, onToggleStatus, onDelete }: Props) {
  if (messages.length === 0) {
    return (
      <div className="message-list__empty">
        <p>No messages found.</p>
        <Link to="/messages/new" className="btn btn--primary">Create your first message</Link>
      </div>
    );
  }

  return (
    <div className="message-list">
      <table className="message-list__table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Upgrade Path</th>
            <th>Status</th>
            <th>Triggers</th>
            <th>Order</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg) => (
            <tr key={msg.id}>
              <td className="message-list__title">
                <Link to={`/messages/${msg.id}`}>{msg.title}</Link>
              </td>
              <td>
                <code className="upgrade-path">{msg.upgradePath}</code>
              </td>
              <td>
                <StatusBadge status={msg.status} />
              </td>
              <td className="message-list__center">
                {msg.triggerConditions.length > 0
                  ? msg.triggerConditions.length
                  : <span className="muted">always</span>}
              </td>
              <td className="message-list__center">{msg.displayOrder}</td>
              <td className="muted">{new Date(msg.updatedAt).toLocaleDateString()}</td>
              <td className="message-list__actions">
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => onToggleStatus(msg.id, msg.status)}
                  title={msg.status === "active" ? "Deactivate" : "Activate"}
                >
                  {msg.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <Link to={`/messages/${msg.id}`} className="btn btn--sm btn--ghost">
                  Edit
                </Link>
                <button
                  className="btn btn--sm btn--danger"
                  onClick={() => onDelete(msg.id, msg.title)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
