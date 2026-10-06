// API base URL — auto-resolves based on environment.
// Local dev (localhost) → local API.
// Production (Vercel)   → Render-hosted API.
// Env var (VITE_API_BASE) overrides everything only if set and valid.

const envUrl = import.meta.env.VITE_API_BASE;

const isValidUrl = (u) =>
  typeof u === "string" &&
  u.startsWith("http") &&
  !u.includes("example.com") &&
  !u.includes("localhost");

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1");

const API_BASE = isValidUrl(envUrl)
  ? envUrl
  : isLocal
    ? "http://localhost:5000/api"
    : "https://uniyo-api.onrender.com/api";

export default API_BASE;
