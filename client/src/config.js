// client/src/config.js
export const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api" // Local development
    : "https://enigma-2-0-14-bits.vercel.app/api"; // Production - YOUR ACTUAL VERCEL URL
