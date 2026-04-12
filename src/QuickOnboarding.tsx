import React from "react";

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
  if (!open) return null;

  return (
    <div
      id={anchorId}
      className="card card--onboarding onboarding--quick"
      style={{ marginBottom: 18 }}
    >
      <div className="onboarding-quick__head">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {title}
        </h2>
        <button type="button" className="btn ghost" onClick={onDismiss}>
          {dismissButtonLabel}
        </button>
      </div>
      <div className="onboarding-quick__body muted-text">{children}</div>
    </div>
  );
}
