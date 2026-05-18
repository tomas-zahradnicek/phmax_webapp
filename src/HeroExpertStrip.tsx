import React from "react";

export type HeroExpertKpi = {
  label: string;
  value: React.ReactNode;
  title?: string;
};

type HeroExpertStripProps = {
  title: string;
  kpis: HeroExpertKpi[];
};

/** Kompaktní expertní řádek v hero – název modulu + hlavní KPI (základní režim má plný kontext). */
export function HeroExpertStrip({ title, kpis }: HeroExpertStripProps) {
  return (
    <div className="hero-expert-strip" aria-label="Expertní přehled">
      <h1 className="hero-expert-strip__title">{title}</h1>
      <dl className="hero-expert-strip__kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="hero-expert-strip__kpi" title={kpi.title}>
            <dt className="hero-expert-strip__kpi-label">{kpi.label}</dt>
            <dd className="hero-expert-strip__kpi-value">{kpi.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
