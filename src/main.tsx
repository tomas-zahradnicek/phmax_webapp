import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { CzechTypographyGuard } from "./CzechTypographyGuard";
import "./styles.css";

function removePrerenderFallbackWhenReady(): void {
  const prerender = document.getElementById("seo-prerender-content");
  if (!prerender) return;

  const root = document.getElementById("root");
  let attempts = 0;
  const maxAttempts = 120;

  const tryRemove = () => {
    attempts += 1;
    if (root?.childElementCount && root.childElementCount > 0) {
      prerender.remove();
      return;
    }
    if (attempts >= maxAttempts) return;
    requestAnimationFrame(tryRemove);
  };

  requestAnimationFrame(tryRemove);
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Missing #root mount point.");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary title="Aplikaci se nepodařilo spustit">
      <CzechTypographyGuard>
        <App />
      </CzechTypographyGuard>
    </ErrorBoundary>
  </React.StrictMode>,
);

removePrerenderFallbackWhenReady();
