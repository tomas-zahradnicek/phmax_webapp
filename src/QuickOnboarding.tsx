import React from "react";

type QuickOnboardingProps = {
  title: string;
  children: React.ReactNode;
  open: boolean;
  onDismiss: () => void;
};

export function QuickOnboarding({ title, children, open, onDismiss }: QuickOnboardingProps) {
  if (!open) return null;

  return (
    <div className="card card--onboarding onboarding--quick" style={{ marginBottom: 18 }}>
      <div className="onboarding-quick__head">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {title}
        </h2>
        <button type="button" className="btn ghost" onClick={onDismiss}>
          Skrýt návod
        </button>
      </div>
      <div className="onboarding-quick__body muted-text">{children}</div>
    </div>
  );
}
