import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { CzechTypographyGuard } from "./CzechTypographyGuard";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary title="Aplikaci se nepodařilo spustit">
      <CzechTypographyGuard>
        <App />
      </CzechTypographyGuard>
    </ErrorBoundary>
  </React.StrictMode>
);
