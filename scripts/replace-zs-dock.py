from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/PhmaxZsPage.tsx"
t = p.read_text(encoding="utf-8")
start = t.find('<motion className="calculator-workspace-dock workspace-sticky"')
if start == -1:
    start = t.find('<div className="calculator-workspace-dock workspace-sticky"')
end = t.find("          }\n          main={", start)
if start == -1 or end == -1:
    print("not found", start, end)
    raise SystemExit(1)

new = '''<div className="workspace-sticky" id="workspace-results-dock" ref={workspaceStickyRef}>
            <CalculatorWorkflowDock
              header={
                <>
                  <div className="tabs tabs--sticky tabs--sticky-sdlike">
                    <button type="button" className={tab === "phmax" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("phmax")}>PHmax</button>
                    <button type="button" className={tab === "pha" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("pha")}>PHAmax</button>
                    <button type="button" className={tab === "php" ? "tab active tab--strong" : "tab tab--strong"} onClick={() => setTab("php")}>PHPmax</button>
                  </div>
                  <p className="muted-text workflow-dock__context-line">
                    {formatZsLayContextLine(MODE_CONFIG[mode].label, tab, incompleteSections)}
                  </p>
                </>
              }
              tone={zsVerdict.tone}
              primaryLabel={zsTabPrimaryLabel}
              primaryValue={zsTabPrimaryValue}
              statusBadge={incompleteSections > 0 ? `Nevyplněné části: ${incompleteSections}` : "Vstupy kompletní"}
              stats={[
                { label: "PHmax", value: totalPhmax },
                { label: "PHAmax", value: totalPha },
                { label: "PHPmax", value: totalPhp },
                { label: "Režim", value: formatModeRežimStatValue(MODE_CONFIG[mode].label) },
              ]}
              verdictLabel={zsVerdict.label}
              verdictDetail={zsVerdict.detail}
              workflowSteps={zsBasicWizardActive ? [] : zsWorkflow.steps}
              viewMode={viewMode}
              actions={[
                { label: "Uložit scénář", onClick: saveSnapshotManually },
                { label: "Export CSV", onClick: handleExportCsv },
                { label: "Porovnat se zálohou", onClick: handleCompareZsWithNamedSnapshot },
              ]}
              footer={
                <details className="workflow-dock__block workflow-dock__block--nav" open={viewMode === "expert"}>
                  <summary className="workflow-dock__summary">
                    <span className="workflow-dock__summary-icon" aria-hidden>▶</span>
                    Navigace a stav modulů
                  </summary>
                  <div className="results-panel__meta">
                    <span className="status-badge status-badge--neutral">Aktivní modul: {tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax"}</span>
                    <span className={`status-badge ${incompleteSections > 0 ? "status-badge--warning" : "status-badge--ok"}`}>
                      {incompleteSections > 0 ? `Nevyplněné části: ${incompleteSections}` : "Všechny hlavní části jsou vyplněné"}
                    </span>
                    {firstIssueSection ? (
                      <button type="button" className="status-link" onClick={() => goToSection(firstIssueSection)}>
                        Přejít na první nevyplněnou část
                      </button>
                    ) : null}
                  </div>
                  {jumpSections.length > 1 ? (
                    <div className="section-jump-nav" role="navigation" aria-label="Skok na sekci výpočtu">
                      {jumpSections.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          className={`section-jump-nav__btn${activeScrollSection === id ? " section-jump-nav__btn--active" : ""}`}
                          onClick={() => goToSection(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </motion>
                  ) : null}
                </details>
              }
            />
        </div>'''

new = new.replace("<motion", "<div").replace("</motion>", "</motion>")
# fix the one I messed - section-jump-nav closing
new = new.replace("</motion>\n                  ) : null}", "</div>\n                  ) : null}")

t = t[:start] + new + t[end:]
p.write_text(t, encoding="utf-8")
print("ZS dock ok")
