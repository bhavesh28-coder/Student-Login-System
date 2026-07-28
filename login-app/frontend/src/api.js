import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function registerUser({ username, password, state, city }) {
  const { data } = await api.post("/register", { username, password, state, city });
  return data;
}

export async function loginUser({ username, password }) {
  const { data } = await api.post("/login", { username, password });
  return data;
}

export async function fetchProfile(token) {
  const { data } = await api.get("/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}
