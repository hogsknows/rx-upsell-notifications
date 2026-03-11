import { Routes, Route, Navigate } from "react-router-dom";
import ListPage from "./pages/ListPage.js";
import NewMessagePage from "./pages/NewMessagePage.js";
import EditMessagePage from "./pages/EditMessagePage.js";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <span className="app-header__title">UNS Message Editor</span>
          <span className="app-header__subtitle">Upsell Notification System</span>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/messages" replace />} />
          <Route path="/messages" element={<ListPage />} />
          <Route path="/messages/new" element={<NewMessagePage />} />
          <Route path="/messages/:id" element={<EditMessagePage />} />
        </Routes>
      </main>
    </div>
  );
}
