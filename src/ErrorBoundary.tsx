import React, { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Nadpis v chybové kartě */
  title?: string;
};

type State = {
  error: Error | null;
};

/**
 * Zachytí pád vnořeného stromu a zobrazí srozumitelnou náhradu (ZŠ má velký strom komponent).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary card section-card" role="alert">
          <h2 className="section-title">{this.props.title ?? "V této části aplikace došlo k chybě"}</h2>
          <p className="muted-text">
            Zkuste obnovit stránku. Pokud se chyba opakuje, nahlaste ji prosím provozovateli aplikace.
          </p>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Obnovit stránku
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
