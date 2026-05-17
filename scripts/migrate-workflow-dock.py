"""Migrate product pages to CalculatorWorkflowDock + focus mode."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1] / "src"

IMPORTS = """import { CalculatorWorkflowDock } from "./CalculatorWorkflowDock";
import { CalculatorStickyContextBar } from "./CalculatorStickyContextBar";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { useCalculatorFocusMode } from "./useCalculatorFocusMode";
"""

FOCUS_HOOK = """  const [focusMode, setFocusMode] = useCalculatorFocusMode();
  const heroHeaderRef = useRef<HTMLElement>(null);
"""

for name in ["PhmaxPvPage.tsx", "PhmaxSsPage.tsx", "PhmaxNv75DeputyPage.tsx", "PhmaxZsPage.tsx"]:
    p = ROOT / name
    t = p.read_text(encoding="utf-8")

    if "CalculatorWorkflowDock" not in t:
        t = t.replace(
            'import { VerdictNextStepsPanel } from "./VerdictNextStepsPanel";\n',
            IMPORTS,
        )

    if "useCalculatorFocusMode" not in t:
        t = t.replace(
            "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n",
            "  const [displayDensity, setDisplayDensity] = useDisplayDensity();\n" + FOCUS_HOOK,
            1,
        )

    t = re.sub(
        r"calculatorShellClassName\(viewMode, displayDensity\)",
        "calculatorShellClassName(viewMode, displayDensity, focusMode)",
        t,
    )

    if "ref={heroHeaderRef}" not in t:
        t = t.replace(
            '<header className="hero hero--feature">',
            '<header className="hero hero--feature" ref={heroHeaderRef}>',
            1,
        )

    if "CalculatorFocusToggle" in t and "setFocusMode}" not in t.split("DisplayDensityToggle")[1][:250]:
        t = t.replace(
            '<DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity}',
            '<DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity}',
            1,
        )
        # insert after first DisplayDensityToggle closing />
        m = re.search(
            r'(<DisplayDensityToggle[^/]+/>)',
            t,
        )
        if m:
            insert = m.group(1) + "\n            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />"
            t = t.replace(m.group(1), insert, 1)

    p.write_text(t, encoding="utf-8")
    print("patched hooks", name)
