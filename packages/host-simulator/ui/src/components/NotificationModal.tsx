import { useState } from "react";
import type { ResolvedMessage, Persona } from "../types/index.js";
import { sendEvent } from "../api/index.js";
import "./NotificationModal.css";

interface Props {
  messages: ResolvedMessage[];
  persona: Persona;
  onDone: () => void;
}

type ActionState = "idle" | "upgrade-sent" | "disabled";

export default function NotificationModal({ messages, persona, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [actionState, setActionState] = useState<ActionState>("idle");

  const message = messages[index];
  const isLast = index === messages.length - 1;
  const total = messages.length;

  async function handleDismiss() {
    await sendEvent("dismiss", persona.id, message.id);
    onDone();
  }

  async function handleUpgradeRequest() {
    await sendEvent("upgrade-request", persona.id, message.id);
    setActionState("upgrade-sent");
  }

  async function handleDisable() {
    await sendEvent("disable", persona.id);
    setActionState("disabled");
  }

  function handleDone() {
    onDone();
  }

  const upgradePath = message.upgradePath;
  const pathColour = upgradePath.startsWith("Essential→Advanced")
    ? "#2563eb"
    : upgradePath.startsWith("Essential→UltimateIQ")
    ? "#7c3aed"
    : "#059669"; // Advanced→UltimateIQ

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <div className="modal__meta">
            <span className="modal__upgrade-path" style={{ background: pathColour }}>
              {upgradePath}
            </span>
            {total > 1 && (
              <span className="modal__progress">
                {index + 1} of {total}
              </span>
            )}
          </div>
          {total > 1 && (
            <div className="modal__dots">
              {messages.map((_, i) => (
                <span
                  key={i}
                  className={`modal__dot ${i === index ? "modal__dot--active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="modal__body">
          <h2 className="modal__title">{message.title}</h2>
          <p className="modal__text">{message.body}</p>
        </div>

        {/* Action confirmation states */}
        {actionState === "upgrade-sent" && (
          <div className="modal__confirmation modal__confirmation--success">
            {persona.isSiteAdmin ? (
              <>
                <strong>You're a Site Admin.</strong>{" "}
                <a href="#store" className="modal__store-link">
                  View upgrade options in the Store →
                </a>
              </>
            ) : (
              <>✓ Upgrade request sent to your Site Admin. They'll receive the details by email.</>
            )}
            <button className="modal__btn modal__btn--primary" onClick={handleDone}>
              Done
            </button>
          </div>
        )}

        {actionState === "disabled" && (
          <div className="modal__confirmation modal__confirmation--muted">
            Notifications disabled. You won't see these messages again.
            <button className="modal__btn modal__btn--primary" onClick={handleDone}>
              Done
            </button>
          </div>
        )}

        {actionState === "idle" && (
          <div className="modal__footer">
            {!isLast && (
              <div className="modal__nav">
                {index > 0 && (
                  <button
                    className="modal__btn modal__btn--outline"
                    onClick={() => setIndex((i) => i - 1)}
                  >
                    ← Back
                  </button>
                )}
                <button
                  className="modal__btn modal__btn--next"
                  onClick={() => setIndex((i) => i + 1)}
                >
                  Next →
                </button>
              </div>
            )}

            {isLast && (
              <>
                {index > 0 && (
                  <div className="modal__nav">
                    <button
                      className="modal__btn modal__btn--ghost"
                      onClick={() => setIndex((i) => i - 1)}
                    >
                      ← Back
                    </button>
                  </div>
                )}
                <div className="modal__actions">
                  <button
                    className="modal__btn modal__btn--ghost"
                    onClick={handleDisable}
                  >
                    Disable Notifications
                  </button>
                  <button
                    className="modal__btn modal__btn--outline"
                    onClick={handleDismiss}
                  >
                    Dismiss
                  </button>
                  <button
                    className="modal__btn modal__btn--primary"
                    onClick={handleUpgradeRequest}
                  >
                    {persona.isSiteAdmin ? "View in Store →" : "Request Upgrade"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
