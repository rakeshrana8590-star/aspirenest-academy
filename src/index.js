import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        console.log("PWA service worker registered");
      })
      .catch((error) => {
        console.log("Service worker registration failed:", error);
      });
  });
}

const rootElement = document.getElementById("root");

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);