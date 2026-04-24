import React from "react";
import type { CompareProductVariantsResult } from "./phmax-product-compare";
import { downloadTextFile, exportCsvLocalized, exportFilenameStamped } from "./export-utils";

type CompareVariantsPanelProps = {
  title: string;
  result: CompareProductVariantsResult | null;
  emptyHint: string;
  exportSlug: "pv" | "sd" | "zs" | "ss";
};

function metricText(value: number | null, suffix = ""): string {
  if (value == null) return "–";
  return `${value.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
}

function deltaText(left: number | null, right: number | null, suffix = ""): string {
  if (left == null || right == null) return "–";
  const delta = right - left;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
}

function deltaTone(left: number | null, right: number | null): "positive" | "negative" | "neutral" {
  if (left == null || right == null) return "neutral";
  if (right > left) return "positive";
  if (right < left) return "negative";
  return "neutral";
}

function missingDeltaReason(left: number | null, right: number | null): string | null {
  if (left != null && right != null) return null;
  return "Rozdíl nelze určit, protože alespoň u jedné varianty chybí dopočtená metrika.";
}

function normalize(value: number | null): number | null {
  return typeof value === "number" ? value : null;
}

function compareVerdict(result: CompareProductVariantsResult): {
  tone: "ok" | "warning" | "neutral";
  text: string;
  practiceNote: string;
} {
  const left = result.metrics[0];
  const right = result.metrics[1];
  if (!left || !right) {
    return {
      tone: "neutral",
      text: "Porovnání je orientační.",
      practiceNote: "Doplňte obě varianty, aby šly vyhodnotit stejné metriky.",
    };
  }

  if (left.validationOk === false || right.validationOk === false) {
    return {
      tone: "warning",
      text: "Nejdřív opravte validační chyby.",
      practiceNote: "Doporučení porovnání berte jen orientačně, dokud nejsou obě varianty bez chyb.",
    };
  }

  const leftPrimary = normalize(left.totalPrimary);
  const rightPrimary = normalize(right.totalPrimary);
  if (leftPrimary == null || rightPrimary == null) {
    return {
      tone: "neutral",
      text: "Není dostupná primární metrika u obou variant.",
      practiceNote: "Zkontrolujte vstupy, aby obě varianty měly dopočtený PHmax.",
    };
  }

  if (leftPrimary === rightPrimary) {
    return {
      tone: "neutral",
      text: "Obě varianty mají stejný PHmax.",
      practiceNote: "Rozhodujte podle provozních kritérií školy (organizace, personál, stabilita).",
    };
  }

  const better = rightPrimary > leftPrimary ? (right.variantLabel || right.variantId) : (left.variantLabel || left.variantId);
  return {
    tone: "ok",
    text: `Vyšší PHmax má varianta „${better}“.`,
    practiceNote: "Pokud je to záměr školy, pokračujte uložením této varianty jako pracovní referenční scénář.",
  };
}

function winnerLabel(left: { variantLabel: string; variantId: string; totalPrimary: number | null }, right: { variantLabel: string; variantId: string; totalPrimary: number | null }): string {
  if (left.totalPrimary == null || right.totalPrimary == null) return "PHmax: nelze určit";
  if (left.totalPrimary === right.totalPrimary) return "PHmax: remíza";
  return left.totalPrimary > right.totalPrimary
    ? `PHmax: vede ${left.variantLabel || left.variantId}`
    : `PHmax: vede ${right.variantLabel || right.variantId}`;
}

export function CompareVariantsPanel({ title, result, emptyHint, exportSlug }: CompareVariantsPanelProps) {
  if (!result || result.metrics.length < 2) {
    return (
      <div className="compare-panel compare-panel--empty" role="status" aria-live="polite">
        <p className="compare-panel__empty">{emptyHint}</p>
      </div>
    );
  }

  const [swapped, setSwapped] = React.useState(false);
  const baseLeft = result.metrics[0];
  const baseRight = result.metrics[1];
  const left = swapped ? baseRight : baseLeft;
  const right = swapped ? baseLeft : baseRight;
  const [copyNotice, setCopyNotice] = React.useState("");
  const generatedAt = React.useMemo(() => new Date().toLocaleString("cs-CZ"), [result]);
  const verdict = compareVerdict(result);
  const phmaxDelta = deltaText(left.totalPrimary, right.totalPrimary, " h");
  const secondaryDelta = deltaText(left.totalSecondary, right.totalSecondary);
  const phmaxDeltaTone = deltaTone(left.totalPrimary, right.totalPrimary);
  const secondaryDeltaTone = deltaTone(left.totalSecondary, right.totalSecondary);
  const phmaxMissingReason = missingDeltaReason(left.totalPrimary, right.totalPrimary);
  const secondaryMissingReason = missingDeltaReason(left.totalSecondary, right.totalSecondary);
  const leftLabel = left.variantLabel || left.variantId;
  const rightLabel = right.variantLabel || right.variantId;
  const winner = winnerLabel(left, right);
  const validationBadge = `Validace: A ${left.validationOk === false ? "chyby" : "OK"} / B ${right.validationOk === false ? "chyby" : "OK"}`;

  React.useEffect(() => {
    if (!copyNotice) return;
    const timer = window.setTimeout(() => setCopyNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);
  const exportCompareJson = () => {
    downloadTextFile(
      exportFilenameStamped(`phmax-${exportSlug}-compare-preview`, "json"),
      JSON.stringify({ generatedAt, ...result }, null, 2),
      "application/json;charset=utf-8",
    );
  };
  const exportCompareCsv = () => {
    const rows: Array<[string, string | number]> = [];
    rows.push(["Varianta A", left.variantLabel || left.variantId]);
    rows.push(["Varianta B", right.variantLabel || right.variantId]);
    rows.push(["PHmax A", left.totalPrimary == null ? "–" : left.totalPrimary]);
    rows.push(["PHmax B", right.totalPrimary == null ? "–" : right.totalPrimary]);
    rows.push(["Sekundární metrika A", left.totalSecondary == null ? "–" : left.totalSecondary]);
    rows.push(["Sekundární metrika B", right.totalSecondary == null ? "–" : right.totalSecondary]);
    rows.push(["Validace A", left.validationOk === false ? "chyby" : "OK"]);
    rows.push(["Validace B", right.validationOk === false ? "chyby" : "OK"]);
    rows.push(["Aktualizováno", generatedAt]);
    rows.push(["Doporučení", result.recommendation]);
    if (result.differences.length > 0) {
      result.differences.slice(0, 6).forEach((line, i) => rows.push([`Rozdíl ${i + 1}`, line]));
    }
    downloadTextFile(
      exportFilenameStamped(`phmax-${exportSlug}-compare-preview`, "csv"),
      exportCsvLocalized(rows),
      "text/csv;charset=utf-8",
    );
  };
  const copyCompareSummary = async () => {
    const lines = [
      `Porovnání variant (${generatedAt})`,
      `A: ${leftLabel}`,
      `B: ${rightLabel}`,
      `PHmax A: ${metricText(left.totalPrimary, " h")}`,
      `PHmax B: ${metricText(right.totalPrimary, " h")}`,
      `Rozdíl PHmax (B - A): ${phmaxDelta}`,
      `Sekundární metrika A: ${metricText(left.totalSecondary)}`,
      `Sekundární metrika B: ${metricText(right.totalSecondary)}`,
      `Rozdíl sekundární metriky (B - A): ${secondaryDelta}`,
      `Doporučení: ${result.recommendation}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyNotice("Porovnání bylo zkopírováno do schránky.");
    } catch {
      setCopyNotice("Kopírování se nepodařilo (omezení prohlížeče).");
    }
  };

  return (
    <section className="compare-panel" aria-label={title}>
      <p className="compare-panel__title">{title}</p>
      <p className="compare-panel__stamp">
        <strong>Aktualizováno:</strong> {generatedAt}
      </p>
      <p className={`compare-panel__verdict compare-panel__verdict--${verdict.tone}`}>{verdict.text}</p>
      <div className="compare-panel__badges" aria-label="Rychlé vyhodnocení porovnání">
        <span className="compare-panel__badge">{winner}</span>
        <span className="compare-panel__badge">{validationBadge}</span>
      </div>
      <p className="compare-panel__basis">
        <strong>A:</strong> {leftLabel} · <strong>B:</strong> {rightLabel}
      </p>
      <div className="compare-panel__grid">
        <article className="compare-panel__card">
          <h4 className="compare-panel__variant">{leftLabel}</h4>
          <p className="compare-panel__metric">
            PHmax: <strong>{metricText(left.totalPrimary, " h")}</strong>
          </p>
          <p className="compare-panel__metric">Sekundární metrika: {metricText(left.totalSecondary)}</p>
          <p className="compare-panel__metric">Validace: {left.validationOk === false ? "chyby" : "OK"}</p>
        </article>
        <article className="compare-panel__card">
          <h4 className="compare-panel__variant">{rightLabel}</h4>
          <p className="compare-panel__metric">
            PHmax: <strong>{metricText(right.totalPrimary, " h")}</strong>
          </p>
          <p className="compare-panel__metric">Sekundární metrika: {metricText(right.totalSecondary)}</p>
          <p className="compare-panel__metric">Validace: {right.validationOk === false ? "chyby" : "OK"}</p>
        </article>
      </div>
      <div className="compare-panel__delta" aria-label="Rozdíl mezi variantami">
        <p className={`compare-panel__delta-item compare-panel__delta-item--${phmaxDeltaTone}`}>
          <strong>Rozdíl PHmax (B - A):</strong> {phmaxDelta}
        </p>
        {phmaxMissingReason ? <p className="compare-panel__delta-note">{phmaxMissingReason}</p> : null}
        <p className={`compare-panel__delta-item compare-panel__delta-item--${secondaryDeltaTone}`}>
          <strong>Rozdíl sekundární metriky (B - A):</strong> {secondaryDelta}
        </p>
        {secondaryMissingReason ? <p className="compare-panel__delta-note">{secondaryMissingReason}</p> : null}
      </div>
      <p className="compare-panel__recommendation">
        <strong>Doporučení:</strong> {result.recommendation}
      </p>
      <p className="compare-panel__practice-note">
        <strong>Co to znamená v praxi:</strong> {verdict.practiceNote}
      </p>
      {result.differences.length > 0 ? (
        <ul className="compare-panel__diffs">
          {result.differences.slice(0, 3).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <div className="compare-panel__actions" role="group" aria-label="Export porovnání">
        <button
          type="button"
          className="btn ghost btn--hero-named"
          aria-pressed={swapped}
          onClick={() => setSwapped((v) => !v)}
        >
          Prohodit A/B
        </button>
        <button type="button" className="btn ghost btn--hero-named" onClick={() => void copyCompareSummary()}>
          Kopírovat porovnání
        </button>
        <button type="button" className="btn ghost btn--hero-named" onClick={exportCompareCsv}>
          Export porovnání (CSV)
        </button>
        <button type="button" className="btn ghost btn--hero-named" onClick={exportCompareJson}>
          Export porovnání (JSON)
        </button>
      </div>
      {copyNotice ? <p className="compare-panel__copy-notice" aria-live="polite">{copyNotice}</p> : null}
    </section>
  );
}
