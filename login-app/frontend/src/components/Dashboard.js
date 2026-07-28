import React from "react";

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <svg
          className="dashboard-pin"
          width="40"
          height="50"
          viewBox="0 0 42 52"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M21 0C9.4 0 0 9.4 0 21c0 15.75 21 31 21 31s21-15.25 21-31C42 9.4 32.6 0 21 0z"
            fill="#f2a94c"
          />
          <circle cx="21" cy="21" r="8.5" fill="#16213a" />
        </svg>

        <h2>Welcome, {user.username}</h2>
        <p className="welcome-sub">You're signed in to Meridian.</p>

        <div className="location-pill">
          📍 {user.city}, {user.state}
        </div>

        <button className="btn-secondary" onClick={onLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
