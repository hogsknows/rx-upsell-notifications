import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createMessage } from "../api/messagesApi.js";
import MessageForm from "../components/MessageForm.js";
import type { MessageDefinitionInput } from "@uns/shared";
import "./FormPage.css";

export default function NewMessagePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(input: MessageDefinitionInput, activate: boolean) {
    setSaving(true);
    setSaveError(null);
    try {
      await createMessage({ ...input, status: activate ? "active" : "inactive" });
      navigate("/messages");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/messages">Messages</Link> / New
          </div>
          <h1 className="page-title">New Message</h1>
        </div>
      </div>
      <MessageForm
        onSave={handleSave}
        onCancel={() => navigate("/messages")}
        saving={saving}
        saveError={saveError}
      />
    </div>
  );
}
