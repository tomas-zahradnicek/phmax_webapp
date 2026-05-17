import React from "react";

type HeroActionsTieredProps = {
  primary: React.ReactNode;
  backups: React.ReactNode;
  technical: React.ReactNode;
  className?: string;
};

export function HeroActionsTiered({ primary, backups, technical, className }: HeroActionsTieredProps) {
  return (
    <div className={["hero-actions-tiered hero-actions--labeled-desktops", className].filter(Boolean).join(" ")}>
      <section className="hero-actions-tiered__group" aria-label="Hlavní akce">
        <h3 className="hero-actions-tiered__label">Hlavní akce</h3>
        <div className="hero-actions-tiered__row">{primary}</div>
      </section>
      <section className="hero-actions-tiered__group" aria-label="Zálohy">
        <h3 className="hero-actions-tiered__label">Zálohy</h3>
        <div className="hero-actions-tiered__row hero-actions-tiered__row--backups">{backups}</div>
      </section>
      <details className="hero-actions-tiered__more">
        <summary className="hero-actions-tiered__more-summary">Více možností (technické)</summary>
        <div className="hero-actions-tiered__row hero-actions-tiered__row--technical">{technical}</div>
      </details>
    </div>
  );
}
