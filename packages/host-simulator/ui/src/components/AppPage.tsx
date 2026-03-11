import type { Persona } from "../types/index.js";
import { resetUser } from "../api/index.js";
import "./AppPage.css";

interface Props {
  persona: Persona;
  noMessagesReason?: string;
  onLogout: () => void;
  onResetAndLogin: () => void;
}

const NAV_ITEMS = ["Calls", "Transcripts", "Analytics", "Coaching", "Settings"];

export default function AppPage({ persona, noMessagesReason, onLogout, onResetAndLogin }: Props) {
  async function handleReset() {
    await resetUser(persona.id);
    onResetAndLogin();
  }

  function reasonLabel(reason?: string) {
    if (!reason) return null;
    const labels: Record<string, string> = {
      opted_out: "Notifications are disabled for this user.",
    };
    return labels[reason] ?? reason;
  }

  return (
    <div className="app-page">
      <nav className="app-nav">
        {NAV_ITEMS.map((item) => (
          <span key={item} className="app-nav__item">
            {item}
          </span>
        ))}
        <div className="app-nav__spacer" />
        <span className="app-nav__user">
          {persona.name} · {persona.licenseTier}
        </span>
        <button className="app-nav__logout" onClick={onLogout}>
          Log out
        </button>
      </nav>

      <div className="app-content">
        <div className="app-content__welcome">
          <h2>Welcome back, {persona.name}.</h2>
          <p>Your calls, transcripts, and insights are ready.</p>
        </div>

        <div className="app-content__placeholder">
          <div className="app-placeholder-card">📞 Recent Calls</div>
          <div className="app-placeholder-card">📝 Transcripts</div>
          <div className="app-placeholder-card">📊 Analytics</div>
        </div>

        <div className="app-content__sim-panel">
          <h3>Simulator controls</h3>

          {noMessagesReason ? (
            <p className="app-sim__reason">
              ℹ {reasonLabel(noMessagesReason) ?? "No messages were shown at login."}
            </p>
          ) : (
            <p className="app-sim__reason">
              ✓ Notifications shown at login. Messages marked as seen.
            </p>
          )}

          <div className="app-sim__actions">
            <button className="app-sim__btn" onClick={handleReset}>
              Reset notifications &amp; log in again
            </button>
            <button className="app-sim__btn app-sim__btn--outline" onClick={onLogout}>
              Switch persona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
