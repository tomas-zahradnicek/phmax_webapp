import { describe, expect, it } from "vitest";

import { buildPupilCountGradeSubtotalsForTests, parsePupilClassGrade } from "./vyrocni-zprava-section04-pupil-count-summary";

describe("vyrocni-zprava-section04-pupil-count-summary", () => {
  it("parsuje ročník z názvu třídy", () => {
    expect(parsePupilClassGrade("1.A")).toBe(1);
    expect(parsePupilClassGrade("9.Z")).toBe(9);
    expect(parsePupilClassGrade("mix")).toBeUndefined();
  });

  it("počítá mezisoučty ročníků, Celkem a stupňů", () => {
    const summary = buildPupilCountGradeSubtotalsForTests([
      { className: "1.A", boys: 10, girls: 11, total: 21 },
      { className: "2.A", boys: 12, girls: 13, total: 25 },
      { className: "6.A", boys: 14, girls: 15, total: 29 },
    ]);
    expect(summary.gradeSubtotals).toHaveLength(3);
    expect(summary.overall).toMatchObject({ total: 75 });
    expect(summary.firstStage).toMatchObject({ total: 46 });
    expect(summary.secondStage).toMatchObject({ total: 29 });
    expect(summary.summaryRowCount).toBe(6);
  });
});
