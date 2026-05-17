import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "PhmaxZsPage.tsx"
t = p.read_text(encoding="utf-8")

t = re.sub(
    r"\s*<section className=\"card card--summary section-card section-card--live-results workspace-sticky__summary\">\s*"
    r"<h2 className=\"section-title\">Aktuální přehled výsledků</h2>\s*"
    r"<SectionLead>[\s\S]*?</SectionLead>\s*",
    "\n",
    t,
    count=1,
)

t = re.sub(r"\s*<InputOutputLegend compact />\s*", "\n", t, count=1)

t = re.sub(
    r"\s*<div className=\"grid four workspace-sticky__stats\">[\s\S]*?</div>\s*",
    "\n",
    t,
    count=1,
)

t = re.sub(
    r"\n            <motion className=\{`workspace-sticky__module-total[\s\S]*?            </motion>\n",
    "\n",
    t,
    count=1,
)
t = re.sub(
    r"\n            <div\n              className=\{`workspace-sticky__module-total[\s\S]*?            </div>\n",
    "\n",
    t,
    count=1,
)

t = re.sub(r"\n          </section>\n        </div>\n          \}", "\n        </div>\n          }", t, count=1)

if 'dockLabel="Kontext výpočtu"' not in t:
    t = t.replace(
        "<CalculatorWorkspaceLayout\n          dock={",
        '<CalculatorWorkspaceLayout\n          dockLabel="Kontext výpočtu"\n          dock={',
        1,
    )

t = t.replace("<strong>Aktuální kontext:</strong> ", "")

p.write_text(t, encoding="utf-8")
print("done")
