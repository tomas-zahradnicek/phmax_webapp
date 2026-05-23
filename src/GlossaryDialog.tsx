import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { useModalDialogA11y } from "./modal-dialog-a11y";

export type GlossaryTerm = { term: string; description: React.ReactNode };

type GlossaryDialogProps = {
  open: boolean;
  onClose: () => void;
  terms: readonly GlossaryTerm[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Volitelně doplní kontext produktu (např. „SŠ“) pod úvodní řádek dialogu. */
  scopeHint?: string;
};

export function GlossaryDialog({ open, onClose, terms, triggerRef, scopeHint }: GlossaryDialogProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useModalDialogA11y({
    open,
    onClose,
    panelRef,
    initialFocusRef: closeBtnRef,
    returnFocusRef: triggerRef,
  });

  if (!open) return null;

  const modal = (
    <div
      className="glossary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-dialog-title"
    >
      <div className="glossary-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="glossary-modal__panel" tabIndex={-1}>
        <div className="glossary-modal__head">
          <div>
            <h2 className="section-title" id="glossary-dialog-title">
              Slovníček pojmů
            </h2>
            <p className="muted-text">
              Pojmy jsou popsány podle metodiky a navazujících právních předpisů, ze kterých kalkulačka vychází.
            </p>
            {scopeHint ? (
              <p className="muted-text" style={{ marginTop: 6 }}>
                {scopeHint}
              </p>
            ) : null}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Zavřít slovníček"
          >
            ✕
          </button>
        </div>
        <div className="glossary-list">
          {terms.map((item) => (
            <div key={item.term} className="glossary-item">
              <div className="glossary-item__term">{item.term}</div>
              <div className="glossary-item__desc">{item.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
}
