import React from "react";
import { ResultCard } from "../phmax-zs-ui";
import { zsOverviewOrientationTotal } from "./zs-pha1r-ui";

type ZsOverviewSectionProps = {
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  totalPha1r: number;
};

export function ZsOverviewSection({ totalPhmax, totalPha, totalPhp, totalPha1r }: ZsOverviewSectionProps) {
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
        PHA1Rmax je samostatná hodnota a do přehledového součtu se nezahrnuje.
      </p>
      <div className="grid four">
        <ResultCard label="PHmax" value={totalPhmax} />
        <ResultCard label="PHAmax – asistenti pedagoga" value={totalPha} />
        <ResultCard label="PHPmax – metodický výpočet" value={totalPhp} />
        <ResultCard label="Přehledový součet" tone="success" value={zsOverviewOrientationTotal(totalPhmax, totalPha, totalPhp)} />
        <ResultCard label="PHA1Rmax" value={totalPha1r} hint="Asistent pedagoga v 1. ročníku, samostatně" />
      </div>
    </section>
  );
}
