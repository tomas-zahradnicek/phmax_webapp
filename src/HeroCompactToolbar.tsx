import React from "react";
import { HERO_TOOLBAR_BACKUPS_LABEL, HERO_TOOLBAR_MORE_TOOLS_LABEL } from "./calculator-ui-constants";
import { HeroIconActionButton, IconSaveQuick } from "./HeroActionIconButton";
import { HeroToolbarDropdown } from "./HeroToolbarDropdown";

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
  backupsSummary = HERO_TOOLBAR_BACKUPS_LABEL,
  technicalSummary = HERO_TOOLBAR_MORE_TOOLS_LABEL,
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
      <HeroToolbarDropdown summary={backupsSummary} panelClassName="hero-compact-toolbar__panel-body--backups">
        {backups}
      </HeroToolbarDropdown>
      <HeroToolbarDropdown
        summary={technicalSummary}
        className="hero-compact-toolbar__panel--technical"
        panelClassName="hero-compact-toolbar__panel-body--technical"
      >
        {technical}
      </HeroToolbarDropdown>
    </div>
  );
}

/** Uložení průběhu v kompaktní hero liště – ikona + tooltip; na desktopu jen ikona (CSS). */
export function HeroToolbarSaveButton({
  onClick,
  label = "Uložit průběh",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <HeroIconActionButton
      className="btn btn--light hero-actions-tiered__cta"
      label={label}
      icon={<IconSaveQuick />}
      onClick={onClick}
    />
  );
}
