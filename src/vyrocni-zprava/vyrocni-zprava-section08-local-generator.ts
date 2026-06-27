import type { Section08GeneratorInput } from "./vyrocni-zprava-section08-generator-input";

export const SECTION08_INCOMPLETE_DRAFT_PREFIX =
  "Kapitolu 08 nelze zatím připravit jako finální návrh. Chybí následující údaje:";

export type Section08DraftResult = {
  ready: boolean;
  text: string;
};

function buildIncompleteDraft(input: Section08GeneratorInput): string {
  const sections = [SECTION08_INCOMPLETE_DRAFT_PREFIX, ...input.missingData.map((item) => `- ${item}`)];
  if (input.recommendedData.length > 0) {
    sections.push("", "Doporučené doplňující údaje (neblokují vytvoření kapitoly):");
    sections.push(...input.recommendedData.map((item) => `- ${item}`));
  }
  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }
  return sections.join("\n");
}

function formatCompleted(value: "ANO" | "NE" | "PROBIHA" | undefined): string {
  if (value === "ANO") return "ANO";
  if (value === "NE") return "NE";
  if (value === "PROBIHA") return "PROBÍHÁ";
  return "neuvedeno";
}

function formatHours(value: number | undefined): string {
  return value === undefined ? "neuvedeno" : `${value}`;
}

function buildQualificationList(
  rows: Section08GeneratorInput["qualificationStudies"] | Section08GeneratorInput["additionalQualificationStudies"],
  emptyMessage: string,
): string {
  const visibleRows = rows.filter(
    (row) => row.title || row.participantGroup || row.provider || row.period || row.completed || row.note,
  );
  if (visibleRows.length === 0) return emptyMessage;
  return visibleRows
    .map((row) => {
      const title = row.title || "Aktivita bez názvu";
      const details = [
        row.participantGroup ? `skupina účastníků: ${row.participantGroup}` : undefined,
        row.provider ? `poskytovatel: ${row.provider}` : undefined,
        row.period ? `období: ${row.period}` : undefined,
        `dokončeno: ${formatCompleted(row.completed)}`,
        row.note ? `poznámka: ${row.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildProfessionalTrainingsList(rows: Section08GeneratorInput["professionalDevelopmentTrainings"]): string {
  const visibleRows = rows.filter(
    (row) => row.title || row.topic || row.participantGroup || row.provider || row.period || row.hours !== undefined || row.note,
  );
  if (visibleRows.length === 0) {
    return "V podkladech nejsou uvedeny konkrétní aktivity prohlubování odborné kvalifikace.";
  }
  return visibleRows
    .map((row) => {
      const title = row.title || "Aktivita bez názvu";
      const details = [
        row.topic ? `téma: ${row.topic}` : undefined,
        row.participantGroup ? `skupina účastníků: ${row.participantGroup}` : undefined,
        row.provider ? `poskytovatel: ${row.provider}` : undefined,
        row.period ? `období: ${row.period}` : undefined,
        `počet hodin: ${formatHours(row.hours)}`,
        row.note ? `poznámka: ${row.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

function buildNonTeachingDevelopmentList(rows: Section08GeneratorInput["nonTeachingStaffDevelopment"]): string {
  const visibleRows = rows.filter(
    (row) => row.title || row.staffGroup || row.provider || row.period || row.hours !== undefined || row.note,
  );
  if (visibleRows.length === 0) {
    return "V podkladech nejsou uvedeny konkrétní aktivity odborného rozvoje nepedagogických pracovníků.";
  }
  return visibleRows
    .map((row) => {
      const title = row.title || "Aktivita bez názvu";
      const details = [
        row.staffGroup ? `skupina pracovníků: ${row.staffGroup}` : undefined,
        row.provider ? `poskytovatel: ${row.provider}` : undefined,
        row.period ? `období: ${row.period}` : undefined,
        `počet hodin: ${formatHours(row.hours)}`,
        row.note ? `poznámka: ${row.note}` : undefined,
      ]
        .filter(Boolean)
        .join("; ");
      return `- ${title}${details ? ` (${details})` : ""}`;
    })
    .join("\n");
}

/** Deterministický návrh kapitoly 08 z validovaných vstupů – bez volání AI a bez domýšlení údajů. */
export function generateSection08Draft(input: Section08GeneratorInput): Section08DraftResult {
  if (input.readiness !== "PRIPRAVENO") {
    return {
      ready: false,
      text: buildIncompleteDraft(input),
    };
  }

  const intro = input.schoolYear
    ? `Ve školním roce ${input.schoolYear} jsou níže uvedeny pouze údaje poskytnuté školou k dalšímu vzdělávání pracovníků.`
    : "Níže jsou uvedeny pouze údaje poskytnuté školou k dalšímu vzdělávání pracovníků.";

  const sections = [
    "08 Údaje o dalším vzdělávání pedagogických pracovníků a odborném rozvoji nepedagogických pracovníků",
    "",
    intro,
    "",
    "8.1 Další vzdělávání pedagogických pracovníků",
    `Popis DVPP ve školním roce: ${input.dvppOverview.description ?? "neuvedeno"}.`,
    input.dvppOverview.priorities ? `Priority DVPP: ${input.dvppOverview.priorities}.` : undefined,
    input.dvppOverview.evaluation ? `Vyhodnocení DVPP: ${input.dvppOverview.evaluation}.` : undefined,
    "",
    "8.1.1 Studium ke splnění kvalifikačních předpokladů",
    buildQualificationList(
      input.qualificationStudies,
      "V podkladech nejsou uvedena konkrétní studia ke splnění kvalifikačních předpokladů.",
    ),
    "",
    "8.1.2 Studium ke splnění dalších kvalifikačních předpokladů",
    buildQualificationList(
      input.additionalQualificationStudies,
      "V podkladech nejsou uvedena konkrétní studia ke splnění dalších kvalifikačních předpokladů.",
    ),
    "",
    "8.1.3 Studium k prohlubování odborné kvalifikace",
    buildProfessionalTrainingsList(input.professionalDevelopmentTrainings),
    "",
    "8.2 Odborný rozvoj nepedagogických pracovníků",
    buildNonTeachingDevelopmentList(input.nonTeachingStaffDevelopment),
    "",
    "8.3 Samostudium",
    `Popis samostudia: ${input.selfStudy.description ?? "neuvedeno"}.`,
    input.selfStudy.topics ? `Témata samostudia: ${input.selfStudy.topics}.` : undefined,
    input.selfStudy.note ? `Poznámka k samostudiu: ${input.selfStudy.note}.` : undefined,
    "",
    `Souhrnné vyhodnocení kapitoly: ${input.summaryEvaluation}.`,
  ].filter((item): item is string => Boolean(item));

  if (input.notes) {
    sections.push("", `Poznámky: ${input.notes}`);
  }

  if (input.warnings.length > 0) {
    sections.push("", "Upozornění k ověření dat:");
    sections.push(...input.warnings.map((item) => `- ${item}`));
  }

  return {
    ready: true,
    text: sections.join("\n"),
  };
}

export function isSection08IncompleteDraft(text: string): boolean {
  return text.trimStart().startsWith(SECTION08_INCOMPLETE_DRAFT_PREFIX);
}
