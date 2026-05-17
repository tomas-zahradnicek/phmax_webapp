import React from "react";

type HeroCompactToolbarProps = {
  primary: React.ReactNode;
  backups: React.ReactNode;
  technical: React.ReactNode;
  backupsSummary?: string;
  technicalSummary?: string;
  className?: string;
};

/**
 * Kompaktní toolbar v hero – hlavní akce v jedné řadě, zálohy a technické v rozbalovacích blocích.
 */
export function HeroCompactToolbar({
  primary,
  backups,
  technical,
  backupsSummary = "Scénáře a zálohy",
  technicalSummary = "Technické",
  className,
}: HeroCompactToolbarProps) {
  return (
    <div className={["hero-compact-toolbar", className].filter(Boolean).join(" ")}>
      <div className="hero-compact-toolbar__primary" role="group" aria-label="Hlavní akce">
        {primary}
      </div>
      <span className="hero-compact-toolbar__divider" aria-hidden>
        │
      </span>
      <details className="hero-compact-toolbar__panel">
        <summary className="hero-compact-toolbar__panel-summary">{backupsSummary}</summary>
        <div className="hero-compact-toolbar__panel-body hero-compact-toolbar__panel-body--backups">{backups}</div>
      </details>
      <details className="hero-compact-toolbar__panel hero-compact-toolbar__panel--technical">
        <summary className="hero-compact-toolbar__panel-summary">{technicalSummary}</summary>
        <div className="hero-compact-toolbar__panel-body hero-compact-toolbar__panel-body--technical">{technical}</div>
      </details>
    </div>
  );
}
