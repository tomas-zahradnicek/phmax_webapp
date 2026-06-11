import React from "react";
import type { CalculatorVerdictTone } from "./calculator-verdict-ui";
import type { HeroExpertKpi } from "./HeroExpertStrip";

function statusIconForTone(tone?: CalculatorVerdictTone): React.ReactNode {
  if (tone === "ok") {
    return (
      <span className="calculator-hero-kpi-chips__status-icon calculator-hero-kpi-chips__status-icon--ok" aria-hidden>
        ✓
      </span>
    );
  }
  if (tone === "warning") {
    return (
      <span className="calculator-hero-kpi-chips__status-icon calculator-hero-kpi-chips__status-icon--warning" aria-hidden>
        !
      </span>
    );
  }
  if (tone === "danger") {
    return (
      <span className="calculator-hero-kpi-chips__status-icon calculator-hero-kpi-chips__status-icon--danger" aria-hidden>
        !
      </span>
    );
  }
  return null;
}

export type CalculatorHeroKpiChipsProps = {
  kpis: HeroExpertKpi[];
  /** Kompaktní řádek bez popisků pod hodnotou (jen tooltip). */
  compact?: boolean;
  /** workspace = světlé karty na šedé ploše. */
  theme?: "hero" | "workspace";
};

/** Sjednocený KPI řádek hero – variant A (čipy místo čtyř boxů). */
export function CalculatorHeroKpiChips({ kpis, compact = false, theme = "hero" }: CalculatorHeroKpiChipsProps) {
  if (!kpis.length) return null;

  return (
    <ul
      className={[
        "calculator-hero-kpi-chips",
        compact ? "calculator-hero-kpi-chips--compact" : "",
        theme === "workspace" ? "calculator-hero-kpi-chips--workspace" : "",
      ]
        .filter(Boolean)
        .join(" ")}

      aria-label="Přehled výsledků"
    >
      {kpis.map((kpi) => (
        <li
          key={kpi.label}
          className={[
            "calculator-hero-kpi-chips__item",
            kpi.variant === "primary" ? "calculator-hero-kpi-chips__item--primary" : "",
            kpi.variant === "secondary" ? "calculator-hero-kpi-chips__item--secondary" : "",
            kpi.variant === "status" ? "calculator-hero-kpi-chips__item--status" : "",
            kpi.tone ? `calculator-hero-kpi-chips__item--tone-${kpi.tone}` : "",
          ]
            .filter(Boolean)
            .join(" ")}
          title={kpi.title ?? `${kpi.label}: ${typeof kpi.value === "string" || typeof kpi.value === "number" ? kpi.value : ""}`}
        >
          {kpi.variant === "status" ? (
            <div className="calculator-hero-kpi-chips__status-main">
              {statusIconForTone(kpi.tone)}
              <span className="calculator-hero-kpi-chips__value">{kpi.value}</span>
            </div>
          ) : (
            <span className="calculator-hero-kpi-chips__value">{kpi.value}</span>
          )}
          {compact && kpi.variant !== "status" ? null : (
            <span className="calculator-hero-kpi-chips__label">{kpi.label}</span>
          )}
          {kpi.footer ? <div className="calculator-hero-kpi-chips__footer">{kpi.footer}</div> : null}
        </li>
      ))}
    </ul>
  );
}
