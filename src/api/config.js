// API base URL — auto-detects environment.
// Local dev AND Vercel use the local API during the demo.
const isLocal = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.includes("vercel.app");

const API_BASE = isLocal
  ? "http://localhost:5000/api"
  : "https://uniyo-api.onrender.com/api";

export default API_BASE;
