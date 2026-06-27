import type { AnnualReportSection05GoalEvaluation } from "./vyrocni-zprava-section05-types";

const SECTION05_DEFAULT_GOAL_TEXTS = [
  "umožnit žákům osvojit si strategie učení a motivovat je pro celoživotní učení",
  "podněcovat žáky k tvořivému myšlení, logickému uvažování a řešení problémů",
  "vést žáky k všestranné, účinné a otevřené komunikaci",
  "rozvíjet u žáků schopnost spolupracovat a respektovat práci vlastní i druhých",
  "vést žáky k toleranci a ohleduplnosti k jiným lidem",
  "podporovat bezpečné, kritické a tvořivé využívání digitálních technologií",
] as const;

export function createSection05DefaultGoals(): AnnualReportSection05GoalEvaluation[] {
  return SECTION05_DEFAULT_GOAL_TEXTS.map((goal) => ({
    goal,
    level: undefined,
    evidence: "",
    note: "",
  }));
}
