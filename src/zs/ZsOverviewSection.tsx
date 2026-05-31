import React from "react";
import { round2 } from "../phmax-zs-logic";
import { ResultCard } from "../phmax-zs-ui";

type ZsOverviewSectionProps = {
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
};

export function ZsOverviewSection({ totalPhmax, totalPha, totalPhp }: ZsOverviewSectionProps) {
  return (
    <section
      className="card muted card--summary section-card section-card--overview"
      data-section="overview"
      data-wizard-step="5"
      data-phmax-pane="summary"
    >
      <h2 className="section-title">Celkový přehled</h2>
      <p className="muted-text">Výsledky PHmax, PHAmax a PHPmax se stanovují samostatně. Součet níže slouží jen pro orientaci.</p>
      <p className="muted-text">
        PHmax, PHAmax – asistenti pedagoga a PHPmax – metodický výpočet se stanovují odděleně. Součet níže je přehledový.
      </p>
      <div className="grid four">
        <ResultCard label="PHmax" value={totalPhmax} />
        <ResultCard label="PHAmax – asistenti pedagoga" value={totalPha} />
        <ResultCard label="PHPmax – metodický výpočet" value={totalPhp} />
        <ResultCard label="Přehledový součet" tone="success" value={round2(totalPhmax + totalPha + totalPhp)} />
      </div>
    </section>
  );
}
