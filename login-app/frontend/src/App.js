import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import { fetchProfile } from "./api";

const TOKEN_KEY = "meridian_token";

export default function App() {
  const [view, setView] = useState("login"); // "login" | "register"
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setView("login");
  }, []);

  // Restore the session on page load if a token is already stored.
  useEffect(() => {
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchProfile(token)
      .then((profile) => setUser(profile))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setCheckingSession(false));
  }, [token]);

  function handleLoginSuccess({ token: newToken, user: newUser }) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  if (checkingSession) {
    return (
      <div className="page-loading">
        <div className="pin-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (token && user) {
    return <Dashboard user={user} onLogout={logout} />;
  }

  return (
    <div className="shell">
      <aside className="shell__panel">
        <div className="map-grid" aria-hidden="true" />
        <div className="shell__brand">
          <svg className="pin-drop" width="42" height="52" viewBox="0 0 42 52" fill="none" aria-hidden="true">
            <path
              d="M21 0C9.4 0 0 9.4 0 21c0 15.75 21 31 21 31s21-15.25 21-31C42 9.4 32.6 0 21 0z"
              fill="url(#pinGradient)"
            />
            <circle cx="21" cy="21" r="8.5" fill="#16213a" />
            <defs>
              <linearGradient id="pinGradient" x1="0" y1="0" x2="42" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f2c46d" />
                <stop offset="1" stopColor="#f2a94c" />
              </linearGradient>
            </defs>
          </svg>
          <h1>Meridian</h1>
          <p className="shell__tagline">
            Sign in with your username, password, and the state &amp; city you call home.
          </p>
        </div>
        <ul className="shell__points">
          <li>Your location helps us personalize your account</li>
          <li>Passwords are hashed &amp; never stored in plain text</li>
          <li>One username, one place on the map</li>
        </ul>
      </aside>

      <main className="shell__form-area">
        <div className="form-card">
          <div className="tabs" role="tablist" aria-label="Choose sign in or create account">
            <button
              role="tab"
              aria-selected={view === "login"}
              className={`tabs__btn ${view === "login" ? "is-active" : ""}`}
              onClick={() => setView("login")}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={view === "register"}
              className={`tabs__btn ${view === "register" ? "is-active" : ""}`}
              onClick={() => setView("register")}
            >
              Create account
            </button>
          </div>

          {view === "login" ? (
            <Login onSuccess={handleLoginSuccess} onSwitchToRegister={() => setView("register")} />
          ) : (
            <Register onRegistered={() => setView("login")} />
          )}
        </div>
      </main>
    </div>
  );
}
