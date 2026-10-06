// Central API URL configuration.
// Uses VITE_API_BASE env var (production), falls back to localhost (dev).
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
export default API_BASE;
