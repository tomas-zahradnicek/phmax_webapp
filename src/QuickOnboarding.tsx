import React, { useEffect, useId, useRef } from "react";

type QuickOnboardingProps = {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onDismiss: () => void;
  /** Kotva pro scroll (např. z horního tlačítka „Stručné pokyny“). */
  anchorId?: string;
  /** Text tlačítka pro skrytí (ZŠ: „Skrýt nápovědu“, jinak výchozí „Skrýt návod“). */
  dismissButtonLabel?: string;
};

export function QuickOnboarding({
  title,
  children,
  open,
  onDismiss,
  anchorId,
  dismissButtonLabel = "Skrýt návod",
}: QuickOnboardingProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = anchorId ? `${anchorId}-title` : `quick-onboarding-title-${reactId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => dismissRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="glossary-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="glossary-modal__backdrop" onClick={onDismiss} aria-hidden="true" />
      <div
        ref={panelRef}
        id={anchorId}
        className="glossary-modal__panel card card--onboarding onboarding--quick"
        tabIndex={-1}
      >
        <div className="onboarding-quick__head">
          <h2 id={titleId} className="section-title" style={{ marginBottom: 0 }}>
            {title}
          </h2>
          <button ref={dismissRef} type="button" className="btn ghost" onClick={onDismiss}>
            {dismissButtonLabel}
          </button>
        </div>
        <div className="onboarding-quick__body">{children}</div>
      </div>
    </div>
  );
}
