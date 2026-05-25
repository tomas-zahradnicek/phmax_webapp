import type { CalculatorVerdictTone } from "../calculator-verdict-ui";

export type ZsValidationIssue = { section: string; label: string };

export type ZsFormValidationInput = {
  tab: "phmax" | "pha" | "php";
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl2Classes: number;
  psychRowCount: number;
  healthRowCount: number;
  minority1Classes: number;
  gymRowCount: number;
  mixedRowCount: number;
  special1Classes: number;
  special2Classes: number;
  specialIIClasses: number;
  prepClasses: number;
  prepSpecialClasses: number;
  phaRowCount: number;
  phpYear1: number;
  phpYear2: number;
  phpYear3: number;
  phpMethodMode: string;
};

export function buildZsValidationIssues(input: ZsFormValidationInput): ZsValidationIssue[] {
  const issues: ZsValidationIssue[] = [];
  if (input.tab === "phmax") {
    if (
      input.basic1Classes === 0 &&
      input.basic2Classes === 0 &&
      input.incl1Classes === 0 &&
      input.incl2Classes === 0 &&
      input.psychRowCount === 0 &&
      input.healthRowCount === 0 &&
      input.minority1Classes === 0 &&
      input.gymRowCount === 0 &&
      input.mixedRowCount === 0 &&
      input.special1Classes === 0 &&
      input.special2Classes === 0 &&
      input.specialIIClasses === 0 &&
      input.prepClasses === 0 &&
      input.prepSpecialClasses === 0
    ) {
      issues.push({ section: "basic", label: "Vyplňte alespoň jednu relevantní sekci v PHmax." });
    }
    if (input.basic1Classes > 0 && input.basic1Pupils === 0) {
      issues.push({ section: "basic", label: "PHmax: na 1. stupni je vyplněn počet tříd, ale chybí počet žáků." });
    }
    if (input.basic2Classes > 0 && input.basic2Pupils === 0) {
      issues.push({ section: "basic", label: "PHmax: na 2. stupni je vyplněn počet tříd, ale chybí počet žáků." });
    }
  }
  if (input.tab === "pha" && input.phaRowCount === 0) {
    issues.push({ section: "pha", label: "Přidejte alespoň jeden řádek do PHAmax." });
  }
  if (input.tab === "php") {
    if (input.phpYear1 === 0 && input.phpYear2 === 0 && input.phpYear3 === 0) {
      issues.push({ section: "php", label: "Zadejte počty žáků pro PHPmax." });
    }
    if (
      input.phpMethodMode === "three_year_avg" &&
      (input.phpYear1 === 0 || input.phpYear2 === 0 || input.phpYear3 === 0)
    ) {
      issues.push({
        section: "php",
        label: "PHPmax (3 roky): doplňte všechny 3 roky, nebo přepněte na kratší období.",
      });
    }
  }
  return issues;
}

export type ZsVerdictCopy = {
  tone: CalculatorVerdictTone;
  label: string;
  detail: string;
};

export function buildZsVerdict(incompleteSections: number, warningCount: number): ZsVerdictCopy {
  if (incompleteSections > 0) {
    return {
      tone: "warning",
      label: "Na hraně: zadání ještě není kompletní",
      detail:
        incompleteSections === 1
          ? "Doplňte poslední nevyplněnou část a znovu zkontrolujte souhrn."
          : `Doplňte ${incompleteSections} nevyplněné části (tlačítko „Přejít na první nevyplněnou část“ vás navede).`,
    };
  }
  if (warningCount > 0) {
    return {
      tone: "warning",
      label: "Pozor na hraniční pravidla",
      detail: "Výpočet proběhl, ale obsahuje upozornění k výjimkám nebo ruční kontrole podle metodiky.",
    };
  }
  return {
    tone: "ok",
    label: "Vstupy jsou kompletní",
    detail: "Souhrn PHmax/PHAmax/PHPmax je připravený pro export, uložení varianty nebo porovnání scénářů.",
  };
}

export type ZsWorkflowStep = { label: string; state: "done" | "active" | "todo" };

export function buildZsWorkflow(
  incompleteSections: number,
  warningCount: number,
): { recommendedStep: string; steps: ZsWorkflowStep[] } {
  if (incompleteSections > 0) {
    return {
      recommendedStep:
        incompleteSections === 1
          ? "Doplňte poslední nevyplněnou část."
          : `Doplňte ${incompleteSections} nevyplněné části.`,
      steps: [
        { label: "Vyplnit povinné vstupy v aktivních modulech", state: "active" },
        { label: "Zkontrolovat upozornění a hraniční pravidla", state: "todo" },
        { label: "Uložit, exportovat nebo porovnat variantu", state: "todo" },
      ],
    };
  }
  if (warningCount > 0) {
    return {
      recommendedStep: "Projděte upozornění a potvrďte, že odpovídají metodice školy.",
      steps: [
        { label: "Vyplnit povinné vstupy v aktivních modulech", state: "done" },
        { label: "Zkontrolovat upozornění a hraniční pravidla", state: "active" },
        { label: "Uložit, exportovat nebo porovnat variantu", state: "todo" },
      ],
    };
  }
  return {
    recommendedStep: "Souhrn je připravený k uložení, exportu nebo porovnání variant.",
    steps: [
      { label: "Vyplnit povinné vstupy v aktivních modulech", state: "done" },
      { label: "Zkontrolovat upozornění a hraniční pravidla", state: "done" },
      { label: "Uložit, exportovat nebo porovnat variantu", state: "active" },
    ],
  };
}
