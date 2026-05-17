import re
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src" / "PhmaxZsPage.tsx"
text = p.read_text(encoding="utf-8")

if "CalculatorWorkspaceLayout" not in text:
    text = text.replace(
        'import { PageTableOfContents } from "./PageTableOfContents";\n',
        'import { PageTableOfContents } from "./PageTableOfContents";\n'
        'import { CalculatorWorkspaceLayout } from "./CalculatorWorkspaceLayout";\n',
    )

m = re.search(
    r"\n\s*<div className=\"hero-result-layout\">.*?\n\s*</div>\n",
    text,
    re.S,
)
if m:
    text = text[: m.start()] + "\n" + text[m.end() :]

start_marker = '<div className="workspace-sticky" id="workspace-results-dock" ref={workspaceStickyRef}>'
end_marker = '{tab === "phmax" && ('
start = text.find(start_marker)
end = text.find(end_marker)
if start < 0 or end < 0 or end <= start:
    raise SystemExit(f"markers not found start={start} end={end}")

sticky_inner = text[start:end].rstrip()
text = text[:start] + text[end:]

lines = sticky_inner.strip().split("\n")
first = lines[0].replace(
    'className="workspace-sticky"',
    'className="calculator-workspace-dock workspace-sticky"',
)
dock_body = "\n".join(
    [first, '              <p className="calculator-workspace-dock__title">Živý výsledek</p>'] + lines[1:]
)

open_layout = (
    "\n        <CalculatorWorkspaceLayout\n"
    "          dock={\n"
    + dock_body
    + "\n          }\n"
    "          main={\n"
    "            <>\n"
)

setup = '\n        <section className="card card--elevated section-card section-card--setup" data-section="setup"'
if setup not in text:
    raise SystemExit("setup section missing")
text = text.replace(setup, open_layout + setup, 1)

end = '\n        {viewMode === "expert" ? <ProductLegisContextPanel variant="zs" /> : null}'
if "<>/>\n          }\n        />" not in text:
    text = text.replace(
        end,
        "\n            </>\n          }\n        />" + end,
        1,
    )

p.write_text(text, encoding="utf-8")
print("zs ok")
