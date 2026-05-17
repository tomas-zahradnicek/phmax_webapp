"""Add compact toolbar + display density to all product pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
PAGES = [
    "PhmaxSdPage.tsx",
    "PhmaxPvPage.tsx",
    "PhmaxSsPage.tsx",
    "PhmaxNv75DeputyPage.tsx",
    "PhmaxZsPage.tsx",
]

IMPORT_BLOCK = """import { HeroCompactToolbar } from "./HeroCompactToolbar";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import { useDisplayDensity } from "./useDisplayDensity";
"""

for name in PAGES:
    p = ROOT / name
    t = p.read_text(encoding="utf-8")

    if "useDisplayDensity" not in t:
        t = t.replace(
            'import { calculatorShellClassName } from "./calculator-view-mode";',
            IMPORT_BLOCK + 'import { calculatorShellClassName } from "./calculator-view-mode";',
        )

    t = t.replace("import { HeroActionsTiered } from \"./HeroActionsTiered\";\n", "")

    if "useDisplayDensity()" not in t:
        t = t.replace(
            'const [viewMode, setViewMode] = useState<"basic" | "expert">',
            'const [displayDensity, setDisplayDensity] = useDisplayDensity();\n  const [viewMode, setViewMode] = useState<"basic" | "expert">',
            1,
        )

    t = t.replace(
        "calculatorShellClassName(viewMode)",
        "calculatorShellClassName(viewMode, displayDensity)",
    )

    if "DisplayDensityToggle" in t and "setDisplayDensity}" not in t.split("DisplayDensityToggle")[1][:200]:
        # insert toggle before glossary in pills row - pattern varies
        markers = [
            '            <GlossaryIconButton',
            '              <GlossaryIconButton',
        ]
        slug = name.replace("Phmax", "").replace("Page", "").lower()[:8] or "calc"
        toggle = (
            '            <DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity} '
            f'name="{slug}-display-density" />\n'
        )
        inserted = False
        for m in markers:
            if m in t and "DisplayDensityToggle" not in t.split(m)[0][-400:]:
                t = t.replace(m, toggle + m, 1)
                inserted = True
                break
        if not inserted:
            print(f"WARN toggle not inserted: {name}")

    t = t.replace(
        '<section className="hero-zone-actions"',
        '<section className="hero-zone-actions hero-zone-actions--toolbar"',
    )

    t = t.replace(
        '          <p className="hero-zone-label">C. Akce</p>\n',
        '          <motion className="hero-zone-actions__toolbar-row">\n',
    )
    t = t.replace('          <motion className="hero-zone-actions__toolbar-row">\n', '          <div className="hero-zone-actions__toolbar-row">\n')
    # fix double if motion was wrong
    t = t.replace("<motion className=\"hero-zone-actions__toolbar-row\">", "<div className=\"hero-zone-actions__toolbar-row\">")

    # close toolbar row before HeroActionsDrawer - add closing div
    if "hero-zone-actions__toolbar-row" in t and "</div>\n\n          <HeroActionsDrawer>" not in t:
        t = t.replace(
            "\n          <HeroActionsDrawer>",
            "\n          </div>\n\n          <HeroActionsDrawer>",
            1,
        )

    t = t.replace("HeroActionsTiered", "HeroCompactToolbar")

    # remove inline marginTop on example in hero
    t = t.replace(' style={{ marginTop: 14 }}', "", 2)

    p.write_text(t, encoding="utf-8")
    print("ok", name)
