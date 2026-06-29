import type { AnnualReportSection04PupilCountRow } from "./vyrocni-zprava-section04-types";

export type PupilCountSummaryTotals = {
  boys: number;
  girls: number;
  total: number;
};

export type PupilCountTableRowOutput = {
  label: string;
  boys?: number;
  girls?: number;
  total?: number;
  classTeacher?: string;
  isSummaryRow: boolean;
};

function rowTotals(row: AnnualReportSection04PupilCountRow): PupilCountSummaryTotals {
  const boys = row.boys ?? 0;
  const girls = row.girls ?? 0;
  const total = row.total ?? boys + girls;
  return { boys, girls, total };
}

function addTotals(a: PupilCountSummaryTotals, b: PupilCountSummaryTotals): PupilCountSummaryTotals {
  return {
    boys: a.boys + b.boys,
    girls: a.girls + b.girls,
    total: a.total + b.total,
  };
}

export function parsePupilClassGrade(className: string): number | undefined {
  const match = className.trim().match(/^(\d)/);
  if (!match) return undefined;
  const grade = Number.parseInt(match[1]!, 10);
  return grade >= 1 && grade <= 9 ? grade : undefined;
}

/** Sestaví řádky tabulky 4.7 včetně mezisoučtů podle ročníku, Celkem a stupňů. */
export function buildPupilCountTableRowOutputs(rows: AnnualReportSection04PupilCountRow[]): PupilCountTableRowOutput[] {
  const classRows = rows.filter((row) => (row.className ?? "").trim().length > 0);
  if (classRows.length === 0) return [];

  const gradeOrder: number[] = [];
  const rowsByGrade = new Map<number, AnnualReportSection04PupilCountRow[]>();
  const ungradedRows: AnnualReportSection04PupilCountRow[] = [];

  for (const row of classRows) {
    const grade = parsePupilClassGrade(row.className);
    if (grade === undefined) {
      ungradedRows.push(row);
      continue;
    }
    if (!rowsByGrade.has(grade)) gradeOrder.push(grade);
    rowsByGrade.set(grade, [...(rowsByGrade.get(grade) ?? []), row]);
  }

  const outputs: PupilCountTableRowOutput[] = [];
  let overallSummary: PupilCountSummaryTotals = { boys: 0, girls: 0, total: 0 };
  let firstStageSummary: PupilCountSummaryTotals = { boys: 0, girls: 0, total: 0 };
  let secondStageSummary: PupilCountSummaryTotals = { boys: 0, girls: 0, total: 0 };

  for (const grade of gradeOrder) {
    let gradeSummary: PupilCountSummaryTotals = { boys: 0, girls: 0, total: 0 };
    for (const row of rowsByGrade.get(grade) ?? []) {
      outputs.push({
        label: row.className,
        boys: row.boys,
        girls: row.girls,
        total: row.total,
        classTeacher: row.classTeacher,
        isSummaryRow: false,
      });
      const totals = rowTotals(row);
      gradeSummary = addTotals(gradeSummary, totals);
      overallSummary = addTotals(overallSummary, totals);
      if (grade <= 5) firstStageSummary = addTotals(firstStageSummary, totals);
      else secondStageSummary = addTotals(secondStageSummary, totals);
    }
    outputs.push({
      label: `${grade}. ročník`,
      boys: gradeSummary.boys,
      girls: gradeSummary.girls,
      total: gradeSummary.total,
      classTeacher: "",
      isSummaryRow: true,
    });
  }

  for (const row of ungradedRows) {
    outputs.push({
      label: row.className,
      boys: row.boys,
      girls: row.girls,
      total: row.total,
      classTeacher: row.classTeacher,
      isSummaryRow: false,
    });
    overallSummary = addTotals(overallSummary, rowTotals(row));
  }

  outputs.push({
    label: "Celkem",
    boys: overallSummary.boys,
    girls: overallSummary.girls,
    total: overallSummary.total,
    classTeacher: "",
    isSummaryRow: true,
  });
  outputs.push({
    label: "1. stupeň",
    boys: firstStageSummary.boys,
    girls: firstStageSummary.girls,
    total: firstStageSummary.total,
    classTeacher: "",
    isSummaryRow: true,
  });
  outputs.push({
    label: "2. stupeň",
    boys: secondStageSummary.boys,
    girls: secondStageSummary.girls,
    total: secondStageSummary.total,
    classTeacher: "",
    isSummaryRow: true,
  });

  return outputs;
}

export function summarizePupilCountRows(rows: AnnualReportSection04PupilCountRow[]): PupilCountSummaryTotals {
  return classRowsTotals(rows.filter((row) => (row.className ?? "").trim().length > 0));
}

function classRowsTotals(rows: AnnualReportSection04PupilCountRow[]): PupilCountSummaryTotals {
  return rows.reduce<PupilCountSummaryTotals>(
    (acc, row) => addTotals(acc, rowTotals(row)),
    { boys: 0, girls: 0, total: 0 },
  );
}

export function buildPupilCountGradeSubtotalsForTests(rows: AnnualReportSection04PupilCountRow[]) {
  const outputs = buildPupilCountTableRowOutputs(rows);
  return {
    gradeSubtotals: outputs.filter((row) => row.isSummaryRow && /^\d+\. ročník$/.test(row.label)),
    overall: outputs.find((row) => row.label === "Celkem"),
    firstStage: outputs.find((row) => row.label === "1. stupeň"),
    secondStage: outputs.find((row) => row.label === "2. stupeň"),
    summaryRowCount: outputs.filter((row) => row.isSummaryRow).length,
  };
}
