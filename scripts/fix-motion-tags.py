from pathlib import Path

for rel in ["src/CalculatorWorkflowDock.tsx", "src/HeroCompactToolbar.tsx"]:
    p = Path(__file__).resolve().parents[1] / rel
    t = p.read_text(encoding="utf-8")
    t = t.replace("<motion ", "<div ")
    t = t.replace("</motion>", "</div>")
    p.write_text(t, encoding="utf-8")
    print("fixed", rel)
