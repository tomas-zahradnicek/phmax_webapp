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

  if (!open) return null;

  return (
    <div
      id={anchorId}
      className="card card--onboarding onboarding--quick"
      style={{ marginBottom: 18 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="onboarding-quick__head">
        <h2 id={titleId} className="section-title" style={{ marginBottom: 0 }}>
          {title}
        </h2>
        <button ref={dismissRef} type="button" className="btn ghost" onClick={onDismiss}>
          {dismissButtonLabel}
        </button>
      </div>
      <div className="onboarding-quick__body muted-text">{children}</div>
    </div>
  );
}
