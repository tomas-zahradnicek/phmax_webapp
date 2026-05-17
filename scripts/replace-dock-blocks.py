"""Replace old dock blocks with CalculatorWorkflowDock on SS and NV75."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"

# SS
ss = ROOT / "PhmaxSsPage.tsx"
t = ss.read_text(encoding="utf-8")
t = t.replace(
    'import { VerdictNextStepsPanel } from "./VerdictNextStepsPanel";\n',
    """import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";
import { CalculatorStickyContextBar } from "./CalculatorStickyContextBar";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
import { SsHumanSummary } from "./SsHumanSummary";
""",
)
t = t.replace(
    "import { ResultAnchorCard } from \"./ResultAnchorCard\";\n",
    "",
)
t = t.replace(
    'import { CollapsibleSection } from "./CollapsibleSection";\n',
    "",
)
if "useCalculatorFocusMode" not in t:
    t = t.replace(
        "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n",
        "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n"
        "  const [focusMode, setFocusMode] = useCalculatorFocusMode();\n"
        "  const heroHeaderRef = useRef<HTMLElement>(null);\n",
        1,
    )
t = t.replace(
    "calculatorShellClassName(viewMode, displayDensity)",
    "calculatorShellClassName(viewMode, displayDensity, focusMode)",
)
t = t.replace(
    '<header className="hero hero--feature">',
    '<header className="hero hero--feature" ref={heroHeaderRef}>',
    1,
)
if "CalculatorFocusToggle" not in t.split("DisplayDensityToggle")[1][:300]:
    t = t.replace(
        'name="ss-display-density" />\n',
        'name="ss-display-density" />\n            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />\n',
        1,
    )

# insert ss row metrics before return if missing
if "ssErrorRows" not in t:
    t = t.replace(
        "  const ssWorkflow = (() => {",
        "  const ssErrorRows = ss.preview.filter((p) => !p.skipped && \"error\" in p).length;\n"
        "  const ssOkRows = ss.preview.filter((p) => !p.skipped && !(\"error\" in p)).length;\n"
        "  const ssWorkflow = (() => {",
        1,
    )

old_ss_dock = """          <motion className="calculator-workspace-dock__card">
            <p className="calculator-workspace-dock__title">Živý výsledek</p>
            <ResultAnchorCard"""

# use div
start = t.find('          <div className="calculator-workspace-dock__card">')
end = t.find("        }\n        main={", start)
if start != -1 and end != -1:
    new_dock = """          <CalculatorWorkflowDock
            header={
              <SsHumanSummary
                classCount={ss.computedRows.length}
                phmaxTotal={ssMetrics.phmaxTotal}
                rowCount={ssMetrics.rowCount}
                okRows={ssOkRows}
                conflictCount={ssErrorRows}
              />
            }
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
            workflowSteps={ssWorkflow.steps}
            viewMode={viewMode}
            actions={[
              { label: "Uložit scénář", onClick: ss.saveSnapshotManually },
              { label: "Export CSV", onClick: ss.handleExportCsv },
              { label: "Porovnat se zálohou", onClick: ss.handleCompareSsWithNamedSnapshot },
            ]}
          />"""
    t = t[:start] + new_dock + t[end:]
    print("SS dock replaced")
else:
    print("SS dock block not found", start, end)

if "CalculatorStickyContextBar" in t and "anchorRef={heroHeaderRef}" not in t:
    t = t.replace(
        "      </header>\n\n      <GlossaryDialog",
        """      </header>

      <CalculatorStickyContextBar
        anchorRef={heroHeaderRef}
        primaryLabel="Součet PHmax"
        primaryValue={phmaxHeroValue}
        statusText={ssVerdict.label}
        tone={ssVerdict.tone}
        onSave={ss.saveSnapshotManually}
        onExport={ss.handleExportCsv}
      />

      <GlossaryDialog""",
        1,
    )

ss.write_text(t, encoding="utf-8")

# NV75
nv = ROOT / "PhmaxNv75DeputyPage.tsx"
t = nv.read_text(encoding="utf-8")
if "CalculatorWorkflowDock" not in t:
    t = t.replace(
        'import { HeroCompactToolbar } from "./HeroCompactToolbar";\n',
        'import { HeroCompactToolbar } from "./HeroCompactToolbar";\n'
        'import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";\n'
        'import { CalculatorStickyContextBar } from "./CalculatorStickyContextBar";\n'
        'import { CalculatorFocusToggle } from "./CalculatorFocusToggle";\n'
        'import { useCalculatorFocusMode } from "./useCalculatorFocusMode";\n',
    )
if "useCalculatorFocusMode" not in t:
    t = t.replace(
        "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n",
        "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n"
        "  const [focusMode, setFocusMode] = useCalculatorFocusMode();\n"
        "  const heroHeaderRef = useRef<HTMLElement>(null);\n",
        1,
    )
t = t.replace(
    "calculatorShellClassName(viewMode, displayDensity)",
    "calculatorShellClassName(viewMode, displayDensity, focusMode)",
)
if 'ref={heroHeaderRef}' not in t:
    t = t.replace(
        '<header className="hero hero--feature">',
        '<header className="hero hero--feature" ref={heroHeaderRef}>',
        1,
    )
if "CalculatorFocusToggle" not in t.split("nv75-display-density")[0][-200:]:
    t = t.replace(
        'name="nv75-display-density" />\n',
        'name="nv75-display-density" />\n              <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />\n',
        1,
    )

# NV75 dock is inside section - find ResultAnchorCard block
start = t.find("<ResultAnchorCard", t.find("calculator-workspace-dock"))
if start == -1:
    start = t.find("<ResultAnchorCard", t.find("dock={"))
end = t.find("</section>", t.find("<section className=\"hero-zone-actions"))
# simpler: replace from hero-zone-actions section through HeroActionsDrawer - NV75 is different structure

# NV75 has dock in workspace - search calculator-workspace
idx = t.find("CalculatorWorkspaceLayout")
if idx != -1:
    dock_start = t.find("dock={", idx)
    dock_start = t.find("<ResultAnchorCard", dock_start)
    dock_end = t.find("            </CollapsibleSection>", dock_start)
    if dock_start != -1 and dock_end != -1:
        dock_end = t.find("\n", t.find("</CollapsibleSection>", dock_start)) + 1
        # read more context
        pass

nv.write_text(t, encoding="utf-8")
print("nv75 partial")
