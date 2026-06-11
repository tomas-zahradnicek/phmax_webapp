import React from "react";
import { CALCULATOR_LIMITS_NOTE } from "../calculator-ui-constants";

export type DashHeroToolbarProps = {
  lastRefreshLabel: string;
  onRefresh: () => void;
  onClearLocalData: () => void;
};

export function DashHeroToolbar({ lastRefreshLabel, onRefresh, onClearLocalData }: DashHeroToolbarProps) {
  return (
    <section
      className="hero-zone-actions hero-zone-actions--toolbar calculator-hero-work-card__body"
      aria-label="Akce přehledu školy"
    >
      <div className="calculator-hero-work-card__start calculator-hero-work-card__start--dash">
        <p className="calculator-hero-work-card__dash-lead">
          Stav v tomto prohlížeči · obnoveno <strong>{lastRefreshLabel}</strong>. {CALCULATOR_LIMITS_NOTE}
        </p>
        <div className="calculator-hero-work-card__dash-actions">
          <button type="button" className="btn ghost" onClick={onRefresh}>
            Obnovit z prohlížeče
          </button>
          <button type="button" className="btn ghost" onClick={onClearLocalData}>
            Vymazat lokální data
          </button>
        </div>
      </div>
    </section>
  );
}
