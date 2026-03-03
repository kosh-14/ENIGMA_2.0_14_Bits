// client/src/config.js
export const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api" // Local development
    : "/api"; // Production (Vercel)
