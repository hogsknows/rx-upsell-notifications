import type { Persona } from "../types/index.js";
import "./LoginPage.css";

interface Props {
  personas: Persona[];
  onLogin: (persona: Persona) => void;
  loading: boolean;
  loadingId: string | null;
}

const TIER_COLOUR: Record<string, string> = {
  Essential: "#6b7280",
  Advanced: "#2563eb",
  UltimateIQ: "#7c3aed",
};

function tierBadge(tier: string, isOnTrial: boolean) {
  const label = isOnTrial ? `${tier} (Trial)` : tier;
  const colour = TIER_COLOUR[tier] ?? "#6b7280";
  return (
    <span className="login-card__tier" style={{ background: colour }}>
      {label}
    </span>
  );
}

export default function LoginPage({ personas, onLogin, loading, loadingId }: Props) {
  return (
    <div className="login-page">
      <div className="login-page__header">
        <h1>RX Host Simulator</h1>
        <p>Select a user persona to simulate login and the post-login notification flow.</p>
      </div>

      <div className="login-page__grid">
        {personas.map((persona) => {
          const isLoading = loadingId === persona.id;
          const flagsOff = !persona.instanceFeatureFlag || !persona.tenantFeatureFlag;

          return (
            <div key={persona.id} className="login-card">
              <div className="login-card__top">
                <div className="login-card__name">{persona.name}</div>
                <div className="login-card__role">{persona.role}</div>
                {tierBadge(persona.licenseTier, persona.isOnTrial)}
              </div>

              <div className="login-card__meta">
                {persona.isOnTrial && (
                  <div className="login-card__flag login-card__flag--warn">⚠ On trial — no notifications</div>
                )}
                {flagsOff && (
                  <div className="login-card__flag login-card__flag--warn">⚠ Feature flag disabled</div>
                )}
                {persona.isSiteAdmin && (
                  <div className="login-card__flag login-card__flag--info">★ Site Admin</div>
                )}
                <div className="login-card__kpis">
                  <span>{persona.kpis.totalCallsThisMonth} calls/mo</span>
                  <span>{persona.kpis.activeUserCount} active users</span>
                </div>
              </div>

              <button
                className="login-card__btn"
                onClick={() => onLogin(persona)}
                disabled={loading}
              >
                {isLoading ? "Logging in…" : "Log in"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
