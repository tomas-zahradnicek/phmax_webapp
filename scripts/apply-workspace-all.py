"""Apply CalculatorWorkspaceLayout to PV, SS, NV75."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
IMPORT_LINE = 'import { CalculatorWorkspaceLayout } from "./CalculatorWorkspaceLayout";\n'


def ensure_import(text: str) -> str:
    if "CalculatorWorkspaceLayout" in text:
        return text
    return text.replace(
        'import { PageTableOfContents } from "./PageTableOfContents";\n',
        'import { PageTableOfContents } from "./PageTableOfContents";\n' + IMPORT_LINE,
    )


def remove_hero_result(text: str) -> str:
    m = re.search(
        r"\n\s*<motion className=\"hero-result-layout\">.*?\n\s*</motion>\n",
        text,
        re.S,
    )
    if not m:
        m = re.search(
            r"\n\s*<div className=\"hero-result-layout\">.*?\n\s*</div>\n",
            text,
            re.S,
        )
    if not m:
        raise ValueError("hero-result-layout not found")
    return text[: m.start()] + "\n" + text[m.end() :]


def wrap_content(text: str, start_marker: str, end_marker: str, dock: str) -> str:
    idx = text.find(start_marker)
    if idx < 0:
        raise ValueError(f"missing start: {start_marker[:60]}")
    if "CalculatorWorkspaceLayout" in text[max(0, idx - 2000) : idx]:
        return text
    if end_marker not in text:
        raise ValueError(f"missing end: {end_marker[:60]}")
    text = text.replace(start_marker, dock + start_marker, 1)
    return text.replace(
        end_marker,
        "\n          </>\n        }\n      />" + end_marker,
        1,
    )


PV_DOCK = """
      <CalculatorWorkspaceLayout
        dock={
          <div className="calculator-workspace-dock__card">
            <p className="calculator-workspace-dock__title">Živý výsledek</p>
            <ResultAnchorCard
              tone={pvVerdict.tone}
              primaryLabel="PHmax celkem"
              primaryValue={aggregate.incomplete ? `${aggregate.phmaxSum} *` : aggregate.phmaxSum}
              statusBadge={pvStatusBadge}
              stats={[
                { label: "PHAmax celkem", value: aggregate.phaSum > 0 ? aggregate.phaSum : "–" },
                { label: "Pracoviště ve výpočtu", value: rows.length },
              ]}
              verdictLabel={pvVerdict.label}
              verdictDetail={pvVerdict.detail}
            />
            <CollapsibleSection
              summary="Další kroky, workflow a exporty"
              defaultOpen={viewMode === "expert"}
              level="advanced"
            >
              <p
                className="muted-text"
                style={{ margin: "0 0 10px", fontSize: "0.86rem", lineHeight: 1.5 }}
                aria-live="polite"
              >
                <strong>Průběh:</strong> {formatPvLayContextLine(rows.length, aggregate.incomplete)}
              </p>
              <VerdictNextStepsPanel
                hideVerdict
                tone={pvVerdict.tone}
                verdictLabel={pvVerdict.label}
                verdictDetail={pvVerdict.detail}
                recommendedStep={pvWorkflow.recommendedStep}
                workflowSteps={pvWorkflow.steps}
                actions={[
                  { label: "Uložit scénář", onClick: savePvSnapshotManually },
                  { label: "Export CSV", onClick: handleExportCsv },
                  { label: "Porovnat se zálohou", onClick: handleCompareWithNamedSnapshot },
                ]}
              />
            </CollapsibleSection>
          </div>
        }
        main={
          <>
"""

SS_DOCK = """
      <CalculatorWorkspaceLayout
        dock={
          <div className="calculator-workspace-dock__card">
            <p className="calculator-workspace-dock__title">Živý výsledek</p>
            <ResultAnchorCard
              tone={ssVerdict.tone}
              primaryLabel="Součet PHmax"
              primaryValue={phmaxHeroValue}
              stats={[
                { label: "PHAmax (PrŠ)", value: phamaxHeroValue, title: "Jen PrŠ 78-62-C/01 a 78-62-C/02, denní forma" },
                { label: "Řádků ve formuláři", value: ssMetrics.rowCount },
              ]}
              statusBadge={ssVerdict.label}
              verdictLabel={ssVerdict.label}
              verdictDetail={ssVerdict.detail}
            />
            <CollapsibleSection
              summary="Další kroky, workflow a exporty"
              defaultOpen={viewMode === "expert"}
              level="advanced"
            >
              <p
                className="muted-text"
                style={{ margin: "0 0 10px", fontSize: "0.86rem", lineHeight: 1.5 }}
                aria-live="polite"
              >
                <strong>Průběh:</strong> {formatSsLayContextLine(ssMetrics.rowCount, ss.computedRows.length)}
              </p>
              <VerdictNextStepsPanel
                hideVerdict
                tone={ssVerdict.tone}
                verdictLabel={ssVerdict.label}
                verdictDetail={ssVerdict.detail}
                recommendedStep={ssWorkflow.recommendedStep}
                workflowSteps={ssWorkflow.steps}
                actions={[
                  { label: "Uložit scénář", onClick: ss.saveSnapshotManually },
                  { label: "Export CSV", onClick: ss.handleExportCsv },
                  { label: "Porovnat se zálohou", onClick: ss.handleCompareSsWithNamedSnapshot },
                ]}
              />
            </CollapsibleSection>
          </div>
        }
        main={
          <>
"""

NV75_DOCK = """
        <CalculatorWorkspaceLayout
          dock={
            <div className="calculator-workspace-dock__card">
              <p className="calculator-workspace-dock__title">Živý výsledek</p>
              <ResultAnchorCard
                tone={nv75AnchorTone}
                primaryLabel="Banka odpočtů celkem"
                primaryValue={`${bank.bankHoursTotal} h/týden`}
                stats={[
                  { label: "Pravidlo §4b", value: bank.appliedRule || "–" },
                  { label: "Základ §4b", value: `${bank.bankHoursBase4b} h` },
                  { label: "Bonus §4c + §4d", value: `${bank.bonus4cHours + bank.bonus4dHours} h` },
                ]}
                statusBadge={nv75Verdict.label}
                verdictLabel={nv75Verdict.label}
                verdictDetail={nv75Verdict.detail}
              />
              <CollapsibleSection
                summary="Další kroky, workflow a exporty"
                defaultOpen={viewMode === "expert"}
                level="advanced"
              >
                <p
                  className="muted-text"
                  style={{ margin: "0 0 10px", fontSize: "0.86rem", lineHeight: 1.5 }}
                  aria-live="polite"
                >
                  <strong>Průběh:</strong> {rows.length} řádků, pravidlo §4b: {bank.appliedRule || "–"}, banka{" "}
                  {bank.bankHoursTotal} h/týden.
                </p>
                <VerdictNextStepsPanel
                  hideVerdict
                  tone={nv75Verdict.tone}
                  verdictLabel={nv75Verdict.label}
                  verdictDetail={nv75Verdict.detail}
                  recommendedStep={nv75Workflow.recommendedStep}
                  workflowSteps={nv75Workflow.steps}
                  actions={[
                    { label: "Uložit scénář", onClick: saveNamedSnapshot },
                    { label: "Export CSV", onClick: handleExportCsv },
                    { label: "Porovnat se zálohou", onClick: compareWithNamedSnapshot },
                  ]}
                />
              </CollapsibleSection>
            </div>
          }
          main={
            <>
"""


def main():
    pv = ROOT / "PhmaxPvPage.tsx"
    t = wrap_content(
        remove_hero_result(ensure_import(pv.read_text(encoding="utf-8"))),
        '\n      <section className="card muted section-card" data-section="pv-vysledek"',
        '\n      {viewMode === "expert" ? <ProductLegisContextPanel variant="pv" /> : null}',
        PV_DOCK,
    )
    pv.write_text(t, encoding="utf-8")
    print("pv")

    ss = ROOT / "PhmaxSsPage.tsx"
    t = wrap_content(
        remove_hero_result(ensure_import(ss.read_text(encoding="utf-8"))),
        '\n      <section data-section="ss-vstupy">',
        '\n      {viewMode === "expert" ? <MethodologyStrip /> : null}',
        SS_DOCK,
    )
    ss.write_text(t, encoding="utf-8")
    print("ss")

    nv = ROOT / "PhmaxNv75DeputyPage.tsx"
    t = wrap_content(
        remove_hero_result(ensure_import(nv.read_text(encoding="utf-8"))),
        '\n        <section className="card muted section-card" data-section="nv75-vstupy">',
        '\n        <footer className="zs-app-footer">',
        NV75_DOCK,
    )
    nv.write_text(t, encoding="utf-8")
    print("nv75")


if __name__ == "__main__":
    main()
