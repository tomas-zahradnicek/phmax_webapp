import React, { useEffect, useRef } from "react";

export type GlossaryTerm = { term: string; description: React.ReactNode };

type GlossaryDialogProps = {
  open: boolean;
  onClose: () => void;
  terms: readonly GlossaryTerm[];
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export function GlossaryDialog({ open, onClose, terms, triggerRef }: GlossaryDialogProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="glossary-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-dialog-title"
    >
      <div className="glossary-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="glossary-modal__panel">
        <div className="glossary-modal__head">
          <div>
            <h2 className="section-title" id="glossary-dialog-title">
              Slovníček pojmů
            </h2>
            <p className="muted-text">
              Pojmy jsou popsány podle metodiky a navazujících právních předpisů, ze kterých kalkulačka vychází.
            </p>
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
}
