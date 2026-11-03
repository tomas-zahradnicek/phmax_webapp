export type ZsHeaderTab = "phmax" | "pha" | "php";

export type ZsResultState = "calculated" | "not_entered" | "not_applicable" | "invalid";

export type ZsHeaderMetricId = "phmax" | "pha" | "pha1r" | "php";

export type ZsHeaderMetric = {
  id: ZsHeaderMetricId;
  label: string;
  state: ZsResultState;
  hours: number | null;
};

export type ZsHeaderFacts = {
  tab: ZsHeaderTab;
  totalPhmax: number;
  totalPha: number;
  totalPhp: number;
  totalPha1r: number;
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
  phpExcludedSchool: boolean;
  pha1rClassCount: number;
  pha1rInvalid: boolean;
  pha1rSchoolExcluded: boolean;
};

const LABELS: Record<ZsHeaderMetricId, string> = {
  phmax: "PHmax",
  pha: "PHAmax",
  pha1r: "PHA1Rmax",
  php: "PHPmax",
};

function metric(id: ZsHeaderMetricId, state: ZsResultState, hours: number | null): ZsHeaderMetric {
  return {
    id,
    label: LABELS[id],
    state,
    hours: state === "calculated" ? hours : null,
  };
}

function phmaxSectionCountsAreEmpty(facts: ZsHeaderFacts): boolean {
  return (
    facts.basic1Classes === 0 &&
    facts.basic2Classes === 0 &&
    facts.incl1Classes === 0 &&
    facts.incl2Classes === 0 &&
    facts.psychRowCount === 0 &&
    facts.healthRowCount === 0 &&
    facts.minority1Classes === 0 &&
    facts.gymRowCount === 0 &&
    facts.mixedRowCount === 0 &&
    facts.special1Classes === 0 &&
    facts.special2Classes === 0 &&
    facts.specialIIClasses === 0 &&
    facts.prepClasses === 0 &&
    facts.prepSpecialClasses === 0
  );
}

function classifyPhmax(facts: ZsHeaderFacts): ZsHeaderMetric {
  const pupilsMissing =
    (facts.basic1Classes > 0 && facts.basic1Pupils === 0) ||
    (facts.basic2Classes > 0 && facts.basic2Pupils === 0);
  if (pupilsMissing) return metric("phmax", "invalid", null);
  if (phmaxSectionCountsAreEmpty(facts) && facts.totalPhmax === 0) return metric("phmax", "not_entered", null);
  return metric("phmax", "calculated", facts.totalPhmax);
}

function classifyPha(facts: ZsHeaderFacts): ZsHeaderMetric {
  if (facts.phaRowCount === 0) return metric("pha", "not_entered", null);
  return metric("pha", "calculated", facts.totalPha);
}

function classifyPhp(facts: ZsHeaderFacts): ZsHeaderMetric {
  if (facts.phpExcludedSchool) return metric("php", "calculated", facts.totalPhp);
  const years = [facts.phpYear1, facts.phpYear2, facts.phpYear3];
  const anyYear = years.some((year) => year !== 0);
  if (!anyYear) return metric("php", "not_entered", null);
  if (facts.phpMethodMode === "three_year_avg" && years.some((year) => year === 0)) {
    return metric("php", "invalid", null);
  }
  return metric("php", "calculated", facts.totalPhp);
}

function classifyPha1r(facts: ZsHeaderFacts): ZsHeaderMetric {
  if (facts.pha1rInvalid) return metric("pha1r", "invalid", null);
  if (facts.pha1rSchoolExcluded) return metric("pha1r", "calculated", facts.totalPha1r);
  if (facts.pha1rClassCount === 0) return metric("pha1r", "not_entered", null);
  return metric("pha1r", "calculated", facts.totalPha1r);
}

export function formatZsHeaderMetricValue(metricValue: ZsHeaderMetric): string {
  if (metricValue.state === "calculated") return `${metricValue.hours} h`;
  if (metricValue.state === "not_entered") return "Nezadáno";
  if (metricValue.state === "not_applicable") return "Nevztahuje se";
  return "Nelze spočítat";
}

export function classifyZsHeaderResults(facts: ZsHeaderFacts): ZsHeaderMetric[] {
  const byId: Record<ZsHeaderMetricId, ZsHeaderMetric> = {
    phmax: classifyPhmax(facts),
    pha: classifyPha(facts),
    pha1r: classifyPha1r(facts),
    php: classifyPhp(facts),
  };
  const primaryId: ZsHeaderMetricId = facts.tab === "pha" ? "pha" : facts.tab === "php" ? "php" : "phmax";
  const rest: ZsHeaderMetricId[] = (["phmax", "pha", "pha1r", "php"] as const).filter((id) => id !== primaryId);
  return [primaryId, ...rest].map((id) => byId[id]);
}

export type ZsPresentedHeaderResults = {
  metrics: ZsHeaderMetric[];
  text: Record<ZsHeaderMetricId, string>;
  primaryText: string;
};

/** Same wording for the hero, the ZŠ dock and the sticky summary. */
export function presentZsHeaderResults(facts: ZsHeaderFacts): ZsPresentedHeaderResults {
  const metrics = classifyZsHeaderResults(facts);
  const text = {
    phmax: "",
    pha: "",
    pha1r: "",
    php: "",
  } as Record<ZsHeaderMetricId, string>;
  for (const item of metrics) text[item.id] = formatZsHeaderMetricValue(item);
  return {
    metrics,
    text,
    primaryText: formatZsHeaderMetricValue(metrics[0]),
  };
}
