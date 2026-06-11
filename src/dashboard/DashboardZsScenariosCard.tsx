import React from "react";

type DashboardZsScenariosCardProps = {
  namedBackupCount: number;
  onCompare: () => void;
};

function csScenarioLabel(count: number): string {
  if (count === 1) return "scénář";
  if (count >= 2 && count <= 4) return "scénáře";
  return "scénářů";
}

/** Kompaktní propojení pojmenovaných záloh ZŠ s porovnáním v modulu. */
export function DashboardZsScenariosCard({ namedBackupCount, onCompare }: DashboardZsScenariosCardProps) {
  if (namedBackupCount <= 1) return null;

  return (
    <section
      className="card card--accent section-card dash-zs-scenarios"
      aria-labelledby="dash-zs-scenarios-heading"
      data-testid="dash-zs-scenarios-card"
    >
      <h2 id="dash-zs-scenarios-heading" className="section-title dash-zs-scenarios__title">
        Scénáře ZŠ
      </h2>
      <p className="dash-zs-scenarios__lead">
        Máte <strong>{namedBackupCount}</strong> pojmenované {csScenarioLabel(namedBackupCount)} ZŠ — porovnejte varianty před
        rozhodnutím.
      </p>
      <button type="button" className="btn primary" data-testid="dash-compare-zs-primary" onClick={onCompare}>
        Porovnat scénáře ZŠ
      </button>
    </section>
  );
}
