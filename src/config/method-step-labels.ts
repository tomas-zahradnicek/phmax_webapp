import type { CalculatorMode, MethodStep } from "./calculator-config";

export const METHOD_STEP_LABELS: Record<CalculatorMode, Partial<Record<MethodStep, string>>> = {
  phmax_full_zs: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového maximálního počtu odučených hodin pro školu" },
  phmax_first_stage_only: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového maximálního počtu odučených hodin pro školu" },
  phmax_full_zs_sec16: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě (samostatně pro každý stupeň)", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového maximálního počtu odučených hodin pro školu" },
  phmax_dominant_field: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě (samostatně podle převažujícího oboru vzdělání a stupně)", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového maximálního počtu odučených hodin pro školu" },
  phmax_psychiatric: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového PHmax" },
  phmax_minority_language: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového PHmax" },
  phmax_multiyear_gym: { A: "Vstupní údaje – počty žáků, počty tříd", B: "Stanovení průměrného počtu žáků ve třídě", C: "Stanovení pásma pro určení PHmax", D: "Stanovení celkového PHmax" },
  phmax_extras_38_41_prep: { A: "Vstupní údaje", C: "Přiřazení hodnoty PHmax", D: "Stanovení celkového PHmax" },
  phamax_zs_sec16_special: { A: "Vstupní údaje", B: "Určení příznaku třídy", C: "Stanovení průměrného počtu žáků ve třídě", D: "Přiřazení hodnoty PHAmax", E: "Stanovení celkového PHAmax" },
  phpmax_basic_school: { A: "Vstupní údaje – počty žáků", B: "Stanovení průměrného počtu žáků", C: "Přiřazení hodnoty PHPmax" },
  nv75_teacher: { A: "Výběr typu pedagogické činnosti", B: "Přiřazení k položce tabulky", C: "Výsledek" },
  nv75_headteacher: { A: "Typ školy a počet jednotek", B: "Přiřazení pásma", C: "Výsledek" },
  nv75_deputy: { A: "Počet jednotek", B: "Přiřazení pásma", C: "Výsledek" },
  nv75_other_staff: { A: "Výběr profese", C: "Výsledek" },
};
