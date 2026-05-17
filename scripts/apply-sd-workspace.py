import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "PhmaxSdPage.tsx"
text = p.read_text(encoding="utf-8")

if "CalculatorWorkspaceLayout" not in text:
    text = text.replace(
        'import { PageTableOfContents } from "./PageTableOfContents";\n',
        'import { PageTableOfContents } from "./PageTableOfContents";\n'
        'import { CalculatorWorkspaceLayout } from "./CalculatorWorkspaceLayout";\n',
    )

m = re.search(
    r"\n        <div className=\"hero-result-layout\">.*?\n        </motion>\n\n        <section className=\"hero-zone-actions\"",
    text,
    re.S,
)
if not m:
    m = re.search(
        r"\n        <div className=\"hero-result-layout\">.*?\n        </div>\n\n        <section className=\"hero-zone-actions\"",
        text,
        re.S,
    )
if not m:
    raise SystemExit("hero block not found")
text = text[: m.start()] + '\n        <section className="hero-zone-actions"' + text[m.end() - len('<section className="hero-zone-actions"') :]

dock = """
      <CalculatorWorkspaceLayout
        dock={
          <div className="calculator-workspace-dock__card">
            <p className="calculator-workspace-dock__title">Živý výsledek</p>
            <ResultAnchorCard
              tone={sdVerdict.tone}
              primaryLabel="PHmax"
              primaryValue={sdPhmaxDisplay}
              stats={[
                { label: "Účastníci (1. st.)", value: pupils },
                {
                  label: "Oddělení",
                  value: inputMode === "detail" ? detailDepartments.length : effectiveDepts,
                },
                {
                  label: "Krácení § 10 odst. 2",
                  value: reduction.applied
                    ? `ano (${(Math.round(reduction.factor * 1000) / 10).toLocaleString("cs-CZ")} %)`
                    : "ne",
                },
              ]}
              statusBadge={sdVerdict.label}
              verdictLabel={sdVerdict.label}
              verdictDetail={sdVerdict.detail}
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
                <strong>Průběh:</strong>{" "}
                {formatSdLayContextLine(
                  inputMode,
                  inputMode === "detail" ? detailDepartments.length : effectiveDepts,
                )}
              </p>
              <VerdictNextStepsPanel
                hideVerdict
                tone={sdVerdict.tone}
                verdictLabel={sdVerdict.label}
                verdictDetail={sdVerdict.detail}
                recommendedStep={sdWorkflow.recommendedStep}
                workflowSteps={sdWorkflow.steps}
                actions={[
                  { label: "Uložit scénář", onClick: saveSdSnapshotManually },
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

marker = '\n      <section className="card section-card section-card--sd" data-section="sd-vstupy">'
if "CalculatorWorkspaceLayout" not in text[text.find(marker) - 800 : text.find(marker)]:
    text = text.replace(marker, dock + marker, 1)

close_marker = '\n      {viewMode === "expert" ? <ProductLegisContextPanel variant="sd" /> : null}'
if "<>/>\n        }\n      />" not in text:
    text = text.replace(close_marker, "\n          </>\n        }\n      />" + close_marker, 1)

text2, n = re.subn(
    r"\n        \{stickySummary != null \? \(\n          <div className=\"sd-sticky-summary\"[\s\S]*?\n        \) : null\}\n",
    "\n",
    text,
    count=1,
)
if n:
    text = text2

p.write_text(text, encoding="utf-8")
print("done")
