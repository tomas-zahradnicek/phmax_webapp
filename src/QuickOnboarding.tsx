import React, { useState } from "react";

type QuickOnboardingProps = {
  storageKey: string;
  title: string;
  children: React.ReactNode;
};

export function QuickOnboarding({ storageKey, title, children }: QuickOnboardingProps) {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <div className="card card--onboarding onboarding--quick" style={{ marginBottom: 18 }}>
      <div className="onboarding-quick__head">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {title}
        </h2>
        <button type="button" className="btn ghost" onClick={dismiss}>
          Skrýt návod
        </button>
      </div>
      <div className="onboarding-quick__body muted-text">{children}</div>
    </div>
  );
}
