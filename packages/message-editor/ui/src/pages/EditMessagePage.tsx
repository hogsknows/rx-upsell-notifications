import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getMessage, updateMessage } from "../api/messagesApi.js";
import MessageForm from "../components/MessageForm.js";
import type { MessageDefinition, MessageDefinitionInput } from "@uns/shared";
import "./FormPage.css";

export default function EditMessagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState<MessageDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMessage(id)
      .then(setMessage)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(input: MessageDefinitionInput, activate: boolean) {
    if (!id) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateMessage(id, { ...input, status: activate ? "active" : input.status });
      navigate("/messages");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="state-message">Loading…</p>;
  if (loadError) return <p className="state-message state-message--error">Error: {loadError}</p>;
  if (!message) return <p className="state-message state-message--error">Message not found.</p>;

  const initial: Partial<MessageDefinitionInput> = {
    title: message.title,
    body: message.body,
    upgradePath: message.upgradePath,
    scope: message.scope,
    triggerConditions: message.triggerConditions,
    status: message.status,
    displayOrder: message.displayOrder,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/messages">Messages</Link> / Edit
          </div>
          <h1 className="page-title">Edit Message</h1>
          <p className="page-id">ID: {message.id}</p>
        </div>
      </div>
      <MessageForm
        initial={initial}
        onSave={handleSave}
        onCancel={() => navigate("/messages")}
        saving={saving}
        saveError={saveError}
      />
    </div>
  );
}
