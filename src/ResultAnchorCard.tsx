import React from "react";

export type ResultAnchorTone = "ok" | "warning" | "danger" | "neutral";

export type ResultAnchorStat = {
  label: string;
  value: React.ReactNode;
  title?: string;
};

type ResultAnchorCardProps = {
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  /** Krátký stav pod hodnotou (např. „Vstupy kompletní“). */
  statusBadge?: string;
  stats?: readonly ResultAnchorStat[];
  verdictLabel: string;
  verdictDetail: string;
  issueSummaries?: readonly string[];
  /** Skryje nadpis verdiktu, pokud je stejný jako statusBadge. */
  omitVerdictLabelWhenSameAsStatus?: boolean;
};

/**
 * Dominantní kotva stránky – hlavní výsledek, stav a stručný verdikt (sticky na širších displejích).
 */
export function ResultAnchorCard({
  tone = "neutral",
  primaryLabel,
  primaryValue,
  statusBadge,
  stats = [],
  verdictLabel,
  verdictDetail,
  issueSummaries = [],
  omitVerdictLabelWhenSameAsStatus = false,
}: ResultAnchorCardProps) {
  const showVerdictLabel =
    verdictLabel.trim().length > 0 &&
    !(omitVerdictLabelWhenSameAsStatus && statusBadge && statusBadge === verdictLabel);
  return (
    <aside
      className={`result-anchor-card result-anchor-card--${tone}`}
      aria-label="Hlavní výsledek výpočtu"
    >
      <p className="result-anchor-card__primary-value">{primaryValue}</p>
      <p className="result-anchor-card__primary-label">{primaryLabel}</p>
      {statusBadge ? (
        <p className={`result-anchor-card__status result-anchor-card__status--${tone}`}>{statusBadge}</p>
      ) : null}
      {stats.length > 0 ? (
        <dl className="result-anchor-card__stats">
          {stats.map((s) => (
            <div key={s.label} className="result-anchor-card__stat">
              <dt>{s.label}</dt>
              <dd title={s.title}>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {verdictDetail.trim() || showVerdictLabel || issueSummaries.length > 0 ? (
        <div className="result-anchor-card__verdict">
          {showVerdictLabel ? <p className="result-anchor-card__verdict-label">{verdictLabel}</p> : null}
          {issueSummaries.length > 0 ? (
            <ul className="result-anchor-card__issue-summaries" aria-label="Upozornění">
              {issueSummaries.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : verdictDetail.trim() ? (
            <p className="result-anchor-card__verdict-detail">{verdictDetail}</p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
