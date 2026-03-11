import { useState, useEffect } from "react";
import type { Persona, ResolvedMessage } from "./types/index.js";
import { fetchPersonas, getMessages } from "./api/index.js";
import LoginPage from "./components/LoginPage.js";
import NotificationModal from "./components/NotificationModal.js";
import AppPage from "./components/AppPage.js";
import "./App.css";

type Screen =
  | { name: "login" }
  | { name: "loading"; persona: Persona }
  | { name: "modal"; persona: Persona; messages: ResolvedMessage[] }
  | { name: "app"; persona: Persona; noMessagesReason?: string };

export default function App() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [screen, setScreen] = useState<Screen>({ name: "login" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonas()
      .then(setPersonas)
      .catch(() => setError("Could not load personas. Is the host simulator API running on port 3003?"));
  }, []);

  async function handleLogin(persona: Persona) {
    setScreen({ name: "loading", persona });
    setError(null);
    try {
      const result = await getMessages(persona.id);
      if (result.messages.length > 0) {
        setScreen({ name: "modal", persona, messages: result.messages });
      } else {
        setScreen({ name: "app", persona, noMessagesReason: result.reason });
      }
    } catch {
      setError("Could not reach the message generator. Is it running on port 3002?");
      setScreen({ name: "login" });
    }
  }

  function handleModalDone(persona: Persona) {
    setScreen({ name: "app", persona });
  }

  function handleLogout() {
    setScreen({ name: "login" });
  }

  async function handleResetAndLogin(persona: Persona) {
    // Delivery state already reset by AppPage — just re-run login
    await handleLogin(persona);
  }

  const loadingId =
    screen.name === "loading" ? screen.persona.id : null;

  return (
    <>
      {error && (
        <div className="global-error">{error}</div>
      )}

      {screen.name === "login" || screen.name === "loading" ? (
        <LoginPage
          personas={personas}
          onLogin={handleLogin}
          loading={screen.name === "loading"}
          loadingId={loadingId}
        />
      ) : screen.name === "modal" ? (
        <>
          {/* App renders behind the modal */}
          <AppPage
            persona={screen.persona}
            onLogout={handleLogout}
            onResetAndLogin={() => handleResetAndLogin(screen.persona)}
          />
          <NotificationModal
            messages={screen.messages}
            persona={screen.persona}
            onDone={() => handleModalDone(screen.persona)}
          />
        </>
      ) : (
        <AppPage
          persona={screen.persona}
          noMessagesReason={screen.noMessagesReason}
          onLogout={handleLogout}
          onResetAndLogin={() => handleResetAndLogin(screen.persona)}
        />
      )}
    </>
  );
}
