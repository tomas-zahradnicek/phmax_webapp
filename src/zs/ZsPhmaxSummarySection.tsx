import React from "react";
import { ResultCard } from "../phmax-zs-ui";
import { ZsLegisRef } from "../PhmaxProductLegisUi";

export type ZsPhmaxSummarySectionProps = {
  basicPhmax: number;
  inclPhmax: number;
  psychPhmax: number;
  healthPhmax: number;
  minorityPhmax: number;
  gymPhmax: number;
  mixedForTotal: number;
  specialPhmax: number;
  prepClassPhmax: number;
  prepSpecialPhmax: number;
  par38Phmax: number;
  par41Phmax: number;
  extrasPhmax: number;
  totalPhmax: number;
};

export function ZsPhmaxSummarySection({
  basicPhmax,
  inclPhmax,
  psychPhmax,
  healthPhmax,
  minorityPhmax,
  gymPhmax,
  mixedForTotal,
  specialPhmax,
  prepClassPhmax,
  prepSpecialPhmax,
  par38Phmax,
  par41Phmax,
  extrasPhmax,
  totalPhmax,
}: ZsPhmaxSummarySectionProps) {
  const extraDetailRows: { key: string; label: string; value: number }[] = [];
  if (prepClassPhmax > 0) {
    extraDetailRows.push({ key: "prep", label: "Samostatné – přípravná třída", value: prepClassPhmax });
  }
  if (prepSpecialPhmax > 0) {
    extraDetailRows.push({
      key: "prepSp",
      label: "Samostatné – přípravný stupeň ZŠS",
      value: prepSpecialPhmax,
    });
  }
  if (par38Phmax > 0) {
    extraDetailRows.push({ key: "p38", label: "Samostatné – § 38", value: par38Phmax });
  }
  if (par41Phmax > 0) {
    extraDetailRows.push({ key: "p41", label: "Samostatné – § 41", value: par41Phmax });
  }

  return (
    <section
      className="card muted card--summary section-card section-card--summary-phmax"
      data-section="phmax-summary"
      data-wizard-step="4"
      data-phmax-pane="summary"
    >
      <h2 className="section-title">Souhrn výsledků PHmax</h2>
      <div className="grid four">
        <ResultCard label="Běžné třídy" value={basicPhmax} />
        <ResultCard
          methodStepLabel="§ 16 odst. 9"
          label={<ZsLegisRef citeId="zs-16-9" label="§ 16 odst. 9" />}
          value={inclPhmax}
        />
        <ResultCard label="Škola při psychiatrické nemocnici" value={psychPhmax} />
        <ResultCard label="ZŠ při zdrav. zař. (B11–B13)" value={healthPhmax} />
        <ResultCard label="Jazyk menšiny" value={minorityPhmax} />
        <ResultCard label="Víceletá gymnázia" value={gymPhmax} />
        <ResultCard label="Smíšené třídy" value={mixedForTotal} />
        <ResultCard label="ZŠ speciální" value={specialPhmax} />
        {extraDetailRows.length === 0 ? (
          <ResultCard label="Samostatné položky" value={extrasPhmax} />
        ) : (
          <>
            {extraDetailRows.map((r) =>
              r.key === "p38" ? (
                <ResultCard
                  key={r.key}
                  methodStepLabel={r.label}
                  label={
                    <>
                      Samostatné – <ZsLegisRef citeId="zs-par38" label="§ 38" />
                    </>
                  }
                  value={r.value}
                />
              ) : r.key === "p41" ? (
                <ResultCard
                  key={r.key}
                  methodStepLabel={r.label}
                  label={
                    <>
                      Samostatné – <ZsLegisRef citeId="zs-par41" label="§ 41" />
                    </>
                  }
                  value={r.value}
                />
              ) : (
                <ResultCard key={r.key} label={r.label} value={r.value} />
              ),
            )}
            {extraDetailRows.length > 1 ? (
              <ResultCard label="Samostatné položky celkem" value={extrasPhmax} />
            ) : null}
          </>
        )}
        <ResultCard label="Výsledek PHmax" tone="success" value={totalPhmax} />
      </div>
    </section>
  );
}
