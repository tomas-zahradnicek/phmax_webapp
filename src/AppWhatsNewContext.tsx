import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { APP_VERSION } from "./app-version";
import { PHMAX_CURRENT_RELEASE_NOTES } from "./app-release-notes";
import { markWhatsNewSeen } from "./app-whats-new";
import { useModalDialogA11y } from "./modal-dialog-a11y";

type AppWhatsNewContextValue = {
  openWhatsNew: () => void;
};

const AppWhatsNewContext = createContext<AppWhatsNewContextValue | null>(null);

export function useAppWhatsNew(): AppWhatsNewContextValue {
  const ctx = useContext(AppWhatsNewContext);
  if (!ctx) {
    throw new Error("useAppWhatsNew must be used within AppWhatsNewProvider");
  }
  return ctx;
}

type AppWhatsNewProviderProps = {
  children: React.ReactNode;
};

export function AppWhatsNewProvider({ children }: AppWhatsNewProviderProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    markWhatsNewSeen(APP_VERSION);
    setOpen(false);
  }, []);

  const openWhatsNew = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, []);

  useModalDialogA11y({
    open,
    onClose: dismiss,
    panelRef,
    initialFocusRef: dismissRef,
    returnFocusRef,
  });

  const value = useMemo(() => ({ openWhatsNew }), [openWhatsNew]);

  const notes = PHMAX_CURRENT_RELEASE_NOTES;

  const dialog =
    open && typeof document !== "undefined" ? (
      <div
        className="glossary-modal app-whats-new-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-whats-new-title"
      >
        <div className="glossary-modal__backdrop" onClick={dismiss} aria-hidden="true" />
        <div ref={panelRef} className="glossary-modal__panel card app-whats-new-modal__panel" tabIndex={-1}>
          <div className="glossary-modal__head">
            <div>
              <h2 className="section-title" id="app-whats-new-title">
                {notes.title}
              </h2>
              <p className="muted-text">Krátký přehled změn v této verzi aplikace.</p>
            </div>
            <button
              ref={dismissRef}
              type="button"
              className="btn ghost"
              onClick={dismiss}
              aria-label="Zavřít přehled novinek"
            >
              Zavřít
            </button>
          </div>
          <ul className="app-whats-new-modal__list">
            {notes.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ) : null;

  return (
    <AppWhatsNewContext.Provider value={value}>
      {children}
      {dialog ? createPortal(dialog, document.body) : null}
    </AppWhatsNewContext.Provider>
  );
}
