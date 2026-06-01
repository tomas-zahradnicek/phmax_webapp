import React from "react";
import { ResultCard } from "../phmax-zs-ui";
import type { SdDetailedResult } from "../phmax-sd-logic";

export type SdResultsSectionProps = {
  detailedResult: SdDetailedResult | null;
  basePhmax: number | null;
  effectiveDepts: number;
  avgPerDept: number;
  reduction: { adjusted: number; factor: number; applied: boolean };
  formatSdFactor: (value: number) => string;
  maxDepartments: number;
};

export function SdResultsSection({
  detailedResult,
  basePhmax,
  effectiveDepts,
  avgPerDept,
  reduction,
  formatSdFactor,
  maxDepartments,
}: SdResultsSectionProps) {
  return (
    <div className="grid two section-results" data-section="sd-vysledek" data-wizard-step="3" style={{ marginTop: 18 }}>
      {detailedResult != null ? (
        <>
          <ResultCard label="Oddělení (celkem)" value={detailedResult.totalDepartments} tone="primary" />
          <ResultCard
            label="PHmax (základní tabulková hodnota)"
            hint="Dle přílohy vyhlášky č. 74/2005 Sb. podle celkového počtu oddělení."
            value={detailedResult.basePhmax}
            tone="success"
          />
          {detailedResult.regularDepartments > 0 ? (
            <ResultCard
              label="PHmax – běžná oddělení (po krácení kvůli výjimce)"
              hint="Právní opora: § 10 odst. 2 a 3 vyhlášky č. 74/2005 Sb."
              value={detailedResult.regularSharePhmax}
              tone="primary"
            />
          ) : null}
          {detailedResult.specialDepartments > 0 ? (
            <ResultCard
              label="PHmax – speciální oddělení (po krácení kvůli výjimce)"
              hint="Právní opora: § 10 odst. 7 vyhlášky č. 74/2005 Sb. ve vazbě na § 16 odst. 9 školského zákona."
              value={detailedResult.specialSharePhmax}
              tone="primary"
            />
          ) : null}
          <ResultCard
            label={
              detailedResult.specialDepartments > 0
                ? "PHmax celkem (součet běžných + speciálních oddělení)"
                : "PHmax celkem (běžná oddělení)"
            }
            methodStepLabel={
              detailedResult.specialDepartments > 0 && detailedResult.regularDepartments === 0
                ? "Dílčí PHmax"
                : undefined
            }
            value={detailedResult.finalPhmax}
            tone={detailedResult.specialDepartments > 0 && detailedResult.regularDepartments === 0 ? "primary" : "success"}
          />
          {detailedResult.specialDepartments > 0 ? (
            <ResultCard
              label="PHAmax celkem – speciální oddělení (po krácení kvůli výjimce)"
              hint="Právní opora: § 10 odst. 11 vyhlášky č. 74/2005 Sb. a § 16 odst. 9 školského zákona."
              methodStepLabel="Výsledek PHAmax"
              value={detailedResult.finalPhaMax}
              tone="success"
            />
          ) : null}
        </>
      ) : basePhmax != null ? (
        <>
          <ResultCard label="Počet oddělení pro výpočet" value={effectiveDepts} tone="primary" />
          <ResultCard label="Průměr účastníků na oddělení" value={avgPerDept} tone="primary" />
          <ResultCard label="PHmax (základ z tabulky)" value={basePhmax} tone="success" />
          {reduction.applied ? (
            <ResultCard
              label={`PHmax po krácení (koef. ${formatSdFactor(reduction.factor)})`}
              value={reduction.adjusted}
              tone="success"
            />
          ) : (
            <ResultCard
              label="PHmax po krácení"
              value="neaplikuje se (průměr ≥ 20 na oddělení nebo nejsou údaje)"
              tone="primary"
            />
          )}
        </>
      ) : (
        <p className="muted-text">Zadejte platný počet oddělení (1–{maxDepartments}).</p>
      )}
    </div>
  );
}
