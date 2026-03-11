import { useState, useRef, type ChangeEvent } from "react";
import {
  UPGRADE_PATHS,
  KPI_PLACEHOLDERS,
  TRIGGER_OPERATORS,
  DATE_RANGES,
  DATE_RANGE_LABELS,
  USER_GROUPS,
  USER_GROUP_LABELS,
  type MessageDefinitionInput,
  type TriggerCondition,
} from "@uns/shared";
import KpiPlaceholderPicker from "./KpiPlaceholderPicker.js";
import BodyPreview from "./BodyPreview.js";
import "./MessageForm.css";

interface Props {
  initial?: Partial<MessageDefinitionInput>;
  onSave: (input: MessageDefinitionInput, activate: boolean) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
}

const DEFAULT_FORM: MessageDefinitionInput = {
  title: "",
  body: "",
  upgradePath: "Essential→Advanced",
  scope: { dateRange: "last_month", userGroup: "my_organization" },
  triggerConditions: [],
  status: "inactive",
  displayOrder: 0,
};

export default function MessageForm({ initial, onSave, onCancel, saving, saveError }: Props) {
  const [form, setForm] = useState<MessageDefinitionInput>({ ...DEFAULT_FORM, ...initial });
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  function setField<K extends keyof MessageDefinitionInput>(key: K, value: MessageDefinitionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleInsertToken(token: string) {
    const ta = bodyRef.current;
    if (!ta) {
      setField("body", form.body + token);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    setField("body", next);
    // Restore cursor after the inserted token
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + token.length;
      ta.selectionEnd = start + token.length;
    });
  }

  function addTrigger() {
    setField("triggerConditions", [
      ...form.triggerConditions,
      { kpi: KPI_PLACEHOLDERS[0], operator: "gt", threshold: 0 },
    ]);
  }

  function updateTrigger(index: number, patch: Partial<TriggerCondition>) {
    const next = form.triggerConditions.map((t, i) =>
      i === index ? { ...t, ...patch } : t
    );
    setField("triggerConditions", next);
  }

  function removeTrigger(index: number) {
    setField("triggerConditions", form.triggerConditions.filter((_, i) => i !== index));
  }

  const titleLength = form.title.length;
  const titleWarning = titleLength > 120;

  return (
    <form
      className="message-form"
      onSubmit={(e) => { e.preventDefault(); void onSave(form, false); }}
    >
      {saveError && (
        <div className="form-error">{saveError}</div>
      )}

      {/* Title */}
      <div className="form-field">
        <label className="form-label" htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          className={`form-input ${titleWarning ? "form-input--warning" : ""}`}
          value={form.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setField("title", e.target.value)}
          placeholder="e.g. You have {{unTranscribedMinutes}} minutes of un-transcribed calls"
          required
          maxLength={200}
        />
        <div className={`char-count ${titleWarning ? "char-count--warning" : ""}`}>
          {titleLength} / 120 recommended
        </div>
      </div>

      {/* Upgrade Path + Order + Status */}
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="upgradePath">
            Upgrade Path <span className="required">*</span>
          </label>
          <select
            id="upgradePath"
            className="form-select"
            value={form.upgradePath}
            onChange={(e) => setField("upgradePath", e.target.value as MessageDefinitionInput["upgradePath"])}
          >
            {UPGRADE_PATHS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="displayOrder">Display Order</label>
          <input
            id="displayOrder"
            type="number"
            className="form-input form-input--narrow"
            value={form.displayOrder}
            min={0}
            onChange={(e) => setField("displayOrder", parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div className="form-field">
          <label className="form-label">Status</label>
          <div className="toggle-row">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) => setField("status", e.target.checked ? "active" : "inactive")}
              />
              <span className="toggle__track" />
            </label>
            <span className="toggle-label">
              {form.status === "active" ? "Active" : "Inactive (draft)"}
            </span>
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="scopeDateRange">
            Date Range <span className="required">*</span>
          </label>
          <select
            id="scopeDateRange"
            className="form-select"
            value={form.scope.dateRange}
            onChange={(e) => setField("scope", { ...form.scope, dateRange: e.target.value as MessageDefinitionInput["scope"]["dateRange"] })}
          >
            {DATE_RANGES.map((r) => (
              <option key={r} value={r}>{DATE_RANGE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="scopeUserGroup">
            User Group <span className="required">*</span>
          </label>
          <select
            id="scopeUserGroup"
            className="form-select"
            value={form.scope.userGroup}
            onChange={(e) => setField("scope", { ...form.scope, userGroup: e.target.value as MessageDefinitionInput["scope"]["userGroup"] })}
          >
            {USER_GROUPS.map((g) => (
              <option key={g} value={g}>{USER_GROUP_LABELS[g]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="form-field">
        <label className="form-label" htmlFor="body">
          Body <span className="required">*</span>
        </label>
        <textarea
          id="body"
          ref={bodyRef}
          className="form-textarea"
          value={form.body}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setField("body", e.target.value)}
          placeholder="Describe the benefit of upgrading. Use placeholders for real user data."
          rows={5}
          required
        />
        <KpiPlaceholderPicker onInsert={handleInsertToken} />
        <BodyPreview body={form.body} />
      </div>

      {/* Trigger Conditions */}
      <div className="form-field">
        <div className="trigger-header">
          <label className="form-label">
            Trigger Conditions
            <span className="form-hint"> — all must be true (AND). Empty = always eligible.</span>
          </label>
          <button type="button" className="btn btn--sm btn--secondary" onClick={addTrigger}>
            + Add Condition
          </button>
        </div>

        {form.triggerConditions.length === 0 && (
          <p className="trigger-empty">No conditions — this message is always eligible for its target tier.</p>
        )}

        <div className="trigger-list">
          {form.triggerConditions.map((cond, i) => (
            <div key={i} className="trigger-row">
              <select
                className="form-select trigger-select"
                value={cond.kpi}
                onChange={(e) => updateTrigger(i, { kpi: e.target.value as TriggerCondition["kpi"] })}
              >
                {KPI_PLACEHOLDERS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>

              <select
                className="form-select trigger-op"
                value={cond.operator}
                onChange={(e) => updateTrigger(i, { operator: e.target.value as TriggerCondition["operator"] })}
              >
                {TRIGGER_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              <input
                type="number"
                className="form-input trigger-threshold"
                value={cond.threshold}
                onChange={(e) => updateTrigger(i, { threshold: parseFloat(e.target.value) || 0 })}
              />

              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={() => removeTrigger(i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn--secondary" disabled={saving}>
          {saving ? "Saving…" : "Save as Draft"}
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={saving}
          onClick={() => void onSave(form, true)}
        >
          {saving ? "Saving…" : "Save & Activate"}
        </button>
      </div>
    </form>
  );
}
