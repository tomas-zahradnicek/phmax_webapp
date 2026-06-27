import { describe, expect, it } from "vitest";

import { createDefaultPersonnelData } from "../vyrocni-zprava-personnel-logic";
import { createDefaultSection04Data } from "../vyrocni-zprava-section04-data-logic";
import { createDefaultSection05Data } from "../vyrocni-zprava-section05-data-logic";
import { createDefaultSection06Data } from "../vyrocni-zprava-section06-data-logic";
import { createDefaultSection07Data } from "../vyrocni-zprava-section07-data-logic";
import { createDefaultSection11Data } from "../vyrocni-zprava-section11-data-logic";
import { getStructuredDocxBlocksForSection } from "./vyrocni-zprava-docx-structured-tables";

describe("vyrocni-zprava-docx-structured-tables", () => {
  it("sekce 06 vrací tabulku pro 6.1 s českou desetinnou čárkou", () => {
    const section06 = createDefaultSection06Data();
    section06.firstTermClassResults = [
      {
        className: "1.A",
        pupilsTotal: 29,
        classTeacher: "Mgr. Eva Králová",
        passedWithHonours: 22,
        passed: 7,
        failed: 0,
        notAssessed: 0,
        reducedConductGrade: 0,
        averageGrade: 1.18,
        excusedAbsencePerPupil: 42,
        unexcusedAbsencePerPupil: 0.2,
      },
    ];
    const blocks = getStructuredDocxBlocksForSection("06", { section06Data: section06 });
    const table = blocks.find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.rows[0]).toContain("1,18");
    expect(table.rows[0]).toContain("0,2");
  });

  it("sekce 04.7 používá hlavičku Dívek", () => {
    const section04 = createDefaultSection04Data();
    section04.pupilCountsSeptember = [{ className: "1.A", boys: 10, girls: 11, total: 21, classTeacher: "Mgr. A" }];
    section04.pupilCountsJune = [{ className: "1.A", boys: 10, girls: 10, total: 20, classTeacher: "Mgr. A" }];
    const blocks = getStructuredDocxBlocksForSection("04", { section04Data: section04 });
    const table = blocks.find((block) => block.type === "table" && block.headers.includes("Dívek"));
    expect(table).toBeDefined();
    expect(blocks.some((block) => block.type === "table" && block.headers.includes("Děvčata"))).toBe(false);
  });

  it("sekce 11.1 obsahuje částku 4 200 000 Kč", () => {
    const section11 = createDefaultSection11Data();
    section11.revenue.founderContribution = 4200000;
    const blocks = getStructuredDocxBlocksForSection("11", { section11Data: section11 });
    const table = blocks.find((block) => block.type === "table" && block.headers[0] === "Položka");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.rows.flat().includes("4 200 000 Kč")).toBe(true);
  });

  it("sekce 03.1 obsahuje úvazky s českou desetinnou čárkou", () => {
    const section03 = createDefaultPersonnelData();
    section03.staffCounts.teachersPersons = 18;
    section03.staffCounts.teachersFte = 16.8;
    const blocks = getStructuredDocxBlocksForSection("03", { section03Data: section03 });
    const table31 = blocks.find((block) => block.type === "table" && block.headers.includes("Úvazky"));
    expect(table31?.type).toBe("table");
    if (!table31 || table31.type !== "table") return;
    expect(table31.rows[0]?.[2]).toBe("16,8");
  });

  it("fallback vrací prázdné bloky bez strukturovaných dat", () => {
    expect(getStructuredDocxBlocksForSection("06", undefined)).toEqual([]);
    expect(getStructuredDocxBlocksForSection("06", {})).toEqual([]);
    const section05 = createDefaultSection05Data();
    section05.schoolCurriculumPlan.weeklyHourPlan = [{ subject: "Český jazyk", grade1: 8 }];
    expect(getStructuredDocxBlocksForSection("05", { section05Data: section05 }).length).toBeGreaterThan(0);
    expect(getStructuredDocxBlocksForSection("07", { section07Data: createDefaultSection07Data() }).length).toBeGreaterThan(0);
  });
});
