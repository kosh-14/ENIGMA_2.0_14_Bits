import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Get the root element
const container = document.getElementById("root");

// Create a root
const root = ReactDOM.createRoot(container);

// Initial render
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
