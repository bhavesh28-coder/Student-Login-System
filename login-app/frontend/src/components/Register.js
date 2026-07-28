import React, { useMemo, useState } from "react";
import { registerUser, extractErrorMessage } from "../api";
import { STATE_NAMES, citiesForState } from "../data/statesAndCities";

const initialForm = { username: "", password: "", confirmPassword: "", state: "", city: "" };

export default function Register({ onRegistered }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const cityOptions = useMemo(() => citiesForState(form.state), [form.state]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (form.username.trim().length < 3) return "Username must be at least 3 characters.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.state) return "Please select your state.";
    if (!form.city.trim()) return "Please enter your city.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: form.username.trim(),
        password: form.password,
        state: form.state,
        city: form.city.trim(),
      });
      setSuccess("Account created! You can sign in now.");
      setForm(initialForm);
      setTimeout(() => onRegistered(), 900);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="form-heading">Create your account</h2>
      <p className="form-subheading">Tell us who you are and where you're based.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="reg-username">Username</label>
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            value={form.username}
            onChange={(e) => update("username", e.target.value)}
            required
          />
          <div className="field-hint">3-30 characters: letters, numbers, "." or "_"</div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="reg-confirm-password">Confirm password</label>
            <input
              id="reg-confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="reg-state">State</label>
            <select
              id="reg-state"
              value={form.state}
              onChange={(e) => {
                update("state", e.target.value);
                update("city", "");
              }}
              required
            >
              <option value="" disabled>
                Select a state
              </option>
              {STATE_NAMES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="reg-city">City</label>
            <input
              id="reg-city"
              type="text"
              list="city-suggestions"
              placeholder={form.state ? "e.g. " + (cityOptions[0] || "Your city") : "Select a state first"}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            />
            <datalist id="city-suggestions">
              {cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
