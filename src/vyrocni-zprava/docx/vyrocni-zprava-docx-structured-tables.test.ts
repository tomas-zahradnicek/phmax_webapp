import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../../school-profile/school-profile-logic";
import { createDefaultPersonnelData } from "../vyrocni-zprava-personnel-logic";
import { createDefaultSection04Data } from "../vyrocni-zprava-section04-data-logic";
import { createDefaultSection05Data } from "../vyrocni-zprava-section05-data-logic";
import { createDefaultSection06Data } from "../vyrocni-zprava-section06-data-logic";
import { createDefaultSection07Data } from "../vyrocni-zprava-section07-data-logic";
import { createDefaultSection08Data } from "../vyrocni-zprava-section08-data-logic";
import { createDefaultSection09Data } from "../vyrocni-zprava-section09-data-logic";
import { createDefaultSection11Data } from "../vyrocni-zprava-section11-data-logic";
import { buildPupilCountGradeSubtotalsForTests } from "../vyrocni-zprava-section04-pupil-count-summary";
import { getStructuredDocxBlocksForSection } from "./vyrocni-zprava-docx-structured-tables";

describe("vyrocni-zprava-docx-structured-tables", () => {
  it("sekce 1.1 vrací key-value tabulku školy", () => {
    const profile = createDefaultSchoolProfile();
    profile.name = "ZŠ Test";
    profile.schoolType = "Základní škola";
    profile.ico = "12345678";
    profile.redIzo = "600000000";
    profile.izo = "102000000";
    const blocks = getStructuredDocxBlocksForSection("01", { schoolProfileData: profile });
    const table = blocks.find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.headers).toEqual(["Údaj", "Hodnota"]);
    expect(table.rows.some((row) => row[0] === "Oficiální název školy" && row[1] === "ZŠ Test")).toBe(true);
  });

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

  it("sekce 03.2–3.4 obsahují řádek Celkem a tučný součet", () => {
    const section03 = createDefaultPersonnelData();
    section03.ageAndGender.under35 = { men: 2, women: 3 };
    section03.ageAndGender.age36to45 = { men: 1, women: 1 };
    section03.educationAndGender.maturita = { men: 4, women: 2 };
    section03.qualification.primaryTeachers = { qualified: 5, notQualified: 1 };
    const blocks = getStructuredDocxBlocksForSection("03", { section03Data: section03 });
    const tables = blocks.filter((block) => block.type === "table");
    expect(tables).toHaveLength(4);
    for (const table of tables.slice(1)) {
      if (table.type !== "table") continue;
      const totalRow = table.rows[table.rows.length - 1];
      expect(totalRow?.[0]).toBe("Celkem");
      expect(table.boldBodyRowIndices).toContain(table.rows.length - 1);
    }
  });

  it("sekce 04.7 obsahuje mezisoučty ročníků, Celkem a stupně", () => {
    const section04 = createDefaultSection04Data();
    section04.pupilCountsSeptember = [
      { className: "1.A", boys: 10, girls: 11, total: 21, classTeacher: "Mgr. A" },
      { className: "1.B", boys: 9, girls: 10, total: 19, classTeacher: "Mgr. B" },
      { className: "2.A", boys: 12, girls: 13, total: 25, classTeacher: "Mgr. C" },
      { className: "6.A", boys: 14, girls: 15, total: 29, classTeacher: "Mgr. D" },
    ];
    const summary = buildPupilCountGradeSubtotalsForTests(section04.pupilCountsSeptember);
    expect(summary.gradeSubtotals.map((row) => row.label)).toEqual(["1. ročník", "2. ročník", "6. ročník"]);
    expect(summary.overall).toMatchObject({ boys: 45, girls: 49, total: 94 });
    expect(summary.firstStage).toMatchObject({ boys: 31, girls: 34, total: 65 });
    expect(summary.secondStage).toMatchObject({ boys: 14, girls: 15, total: 29 });

    const blocks = getStructuredDocxBlocksForSection("04", { section04Data: section04 });
    const table = blocks.find((block) => block.type === "table" && block.headers.includes("Dívek"));
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.rows.some((row) => row[0] === "1. ročník" && row[3] === "40")).toBe(true);
    expect(table.rows.some((row) => row[0] === "Celkem" && row[3] === "94")).toBe(true);
    expect(table.rows.some((row) => row[0] === "1. stupeň" && row[3] === "65")).toBe(true);
    expect(table.rows.some((row) => row[0] === "2. stupeň" && row[3] === "29")).toBe(true);
    expect(table.boldBodyRowIndices?.length).toBeGreaterThan(0);
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

  it("sekce 04.2 vrací tabulku ročníků a počtu žáků", () => {
    const section04 = createDefaultSection04Data();
    section04.pupilsAdmittedDuringYear = [
      { grade: "1. ročník", count: 1 },
      { grade: "2. ročník", count: 2 },
    ];
    const blocks = getStructuredDocxBlocksForSection("04", { section04Data: section04 });
    const heading = blocks.find((block) => block.type === "heading" && block.text === "4.2 Žáci přijati v průběhu školního roku");
    expect(heading).toBeDefined();
    const table = blocks.find((block) => block.type === "table" && block.headers[0] === "Ročník");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.rows).toEqual([
      ["1. ročník", "1"],
      ["2. ročník", "2"],
    ]);
  });

  it("sekce 04.6 nezdvojuje známé kategorie a preferuje číselnou hodnotu", () => {
    const section04 = createDefaultSection04Data();
    section04.secondarySchoolAdmissions = [
      { schoolType: "víceleté gymnázium", count: undefined },
      { schoolType: "Víceleté gymnázium", count: 2 },
      { schoolType: "Úplné střední všeobecné vzdělání", count: 4 },
      { schoolType: "Jiná škola", count: 1 },
      { schoolType: "jiná škola", count: undefined },
    ];
    const blocks = getStructuredDocxBlocksForSection("04", { section04Data: section04 });
    const table = blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Typ navazujícího vzdělávání",
    );
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    const viceleteRows = table.rows.filter((row) => row[0] === "Víceleté gymnázium");
    expect(viceleteRows).toHaveLength(1);
    expect(viceleteRows[0]?.[1]).toBe("2");
    const customRows = table.rows.filter((row) => row[0] === "Jiná škola");
    expect(customRows).toHaveLength(1);
    expect(customRows[0]?.[1]).toBe("1");
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

  it("sekce 05.2 používá kompaktní hlavičky ročníků", () => {
    const section05 = createDefaultSection05Data();
    section05.schoolCurriculumPlan.weeklyHourPlan = [{ subject: "ČJ", grade1: 8, grade2: 7 }];
    const blocks = getStructuredDocxBlocksForSection("05", { section05Data: section05 });
    const table = blocks.find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.headers).toContain("1. r.");
    expect(table.headers).toContain("9. r.");
  });

  it("sekce 05.3 vrací tabulku cílů a souhrnné vyhodnocení", () => {
    const section05 = createDefaultSection05Data();
    section05.schoolCurriculumPlan.weeklyHourPlan = [{ subject: "ČJ", grade1: 8 }];
    section05.goalsEvaluation = [
      { goal: "Rozvoj kompetencí", level: "VETSINA_HODIN", evidence: "Projektové dny", note: "ČJ a MAT" },
    ];
    section05.overallEvaluation = "Cíle byly naplňovány průběžně.";
    section05.strengths = "Projektové vyučování.";
    const blocks = getStructuredDocxBlocksForSection("05", { section05Data: section05 });
    expect(blocks.some((block) => block.type === "heading" && block.text === "5.3 Naplňování cílů")).toBe(true);
    const goalsTable = blocks.find((block) => block.type === "table" && block.headers[0] === "Cíl");
    expect(goalsTable?.type).toBe("table");
    if (!goalsTable || goalsTable.type !== "table") return;
    expect(goalsTable.rows[0]?.[0]).toBe("Rozvoj kompetencí");
    expect(goalsTable.rows[0]?.[1]).toContain("většině hodin");
    const summaryTable = blocks.find((block) => block.type === "table" && block.headers[0] === "Položka");
    expect(summaryTable?.type).toBe("table");
  });

  it("sekce 05.2 preferuje advanced curriculum plan před weeklyHourPlan", () => {
    const section05 = createDefaultSection05Data();
    section05.schoolCurriculumPlan.weeklyHourPlan = [{ subject: "ČJ", grade1: 8 }];
    section05.schoolCurriculumPlan.advancedCurriculumPlan = {
      rows: [
        {
          educationalArea: "Jazyk a jazyková komunikace",
          subject: "Český jazyk a literatura",
          subjectDetails: ["Cvičení v anglickém jazyce"],
          grade1: "7+2",
          firstStageAllocation: "33+9",
          grade6: "4+1",
          secondStageAllocation: "15+4",
        },
        {
          educationalArea: "Celkem hodin",
          isTotalRow: true,
          firstStageAllocation: "102+16",
          secondStageAllocation: "104+18",
        },
      ],
    };
    const blocks = getStructuredDocxBlocksForSection("05", { section05Data: section05 });
    const table = blocks.find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.headers).toContain("Dotace I.");
    expect(table.headers).toContain("Dotace II.");
    expect(table.rows[0]?.[1]).toContain("Cvičení v anglickém jazyce");
    expect(table.rows[1]?.[0]).toBe("Celkem hodin");
    expect(table.boldBodyRowIndices).toContain(1);
    expect(table.pageOrientation).toBe("landscape");
  });

  it("sekce 06.1/6.2 používají kompaktní hlavičky", () => {
    const section06 = createDefaultSection06Data();
    section06.firstTermClassResults = [{ className: "1.A", pupilsTotal: 20, averageGrade: 1.18 }];
    section06.secondTermClassResults = [{ className: "1.A", pupilsTotal: 20, averageGrade: 1.2 }];
    const blocks = getStructuredDocxBlocksForSection("06", { section06Data: section06 });
    const table = blocks.find((block) => block.type === "table");
    expect(table?.type).toBe("table");
    if (!table || table.type !== "table") return;
    expect(table.headers).toContain("Vyzn.");
    expect(table.headers).toContain("Neoml. abs./žák");
  });

  it("sekce 08 vrací tabulky 8.1 až 8.2 včetně podkapitol 8.1.1–8.1.3", () => {
    const section08 = createDefaultSection08Data();
    section08.dvppOverview.description = "DVPP probíhalo průběžně.";
    section08.qualificationStudies = [{ title: "Studium A", participantGroup: "Učitelé", completed: "PROBIHA" }];
    section08.additionalQualificationStudies = [{ title: "Studium B", participantGroup: "Učitelé", completed: "ANO" }];
    section08.professionalDevelopmentTrainings = [{ title: "Workshop", topic: "AI", participantGroup: "Sbor", hours: 8 }];
    section08.nonTeachingStaffDevelopment = [{ title: "BOZP", staffGroup: "THP", hours: 4 }];
    const blocks = getStructuredDocxBlocksForSection("08", { section08Data: section08 });
    expect(blocks.some((block) => block.type === "heading" && block.text === "8.1 Další vzdělávání pedagogických pracovníků")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "8.1.1 Studium ke splnění kvalifikačních předpokladů")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "8.1.2 Studium ke splnění dalších kvalifikačních předpokladů")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "8.1.3 Studium k prohlubování odborné kvalifikace")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "8.2 Odborný rozvoj nepedagogických pracovníků")).toBe(true);
    expect(blocks.filter((block) => block.type === "table").length).toBeGreaterThanOrEqual(5);
  });

  it("sekce 07 vrací tabulky 7.1, 7.2, 7.4 a 7.5", () => {
    const section07 = createDefaultSection07Data();
    section07.prevention.preventionStrategyDescription = "Strategie prevence";
    section07.prevention.preventionProgrammes = [{ title: "Program A", targetGroup: "6.-9.", description: "Popis", dateOrPeriod: "2025", provider: "PPP" }];
    section07.riskBehaviourIncidents = [{ type: "Kyberšikana", count: 2, adoptedMeasures: "Pohovory", note: "Opakovaný dohled" }];
    section07.supportConditions.supportMeasuresDescription = "Podpůrná opatření dle doporučení PPP";
    section07.languagePreparation.languagePreparationProvided = "ANO";
    section07.languagePreparation.pupilsWithLanguagePreparationEntitlement = 5;
    section07.languagePreparation.description = "Skupinová výuka ČJ";
    const blocks = getStructuredDocxBlocksForSection("07", { section07Data: section07 });
    expect(blocks.some((block) => block.type === "heading" && block.text === "7.1 Prevence sociálně patologických jevů a rizikového chování")).toBe(true);
    expect(blocks.some((block) => block.type === "paragraph" && block.text === "Preventivní programy a aktivity")).toBe(true);
    const programTable = blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Název programu/aktivity",
    );
    expect(programTable?.type).toBe("table");
    if (programTable && programTable.type === "table") {
      expect(programTable.columnWidthsPercent?.length).toBe(5);
    }
    expect(blocks.some((block) => block.type === "heading" && block.text === "7.2 Počet výskytu rizikového chování, které škola řešila, a přijatá opatření")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "7.4 Podmínky pro vzdělávání a zajištění podpory")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "7.5 Zajištění podpory žáků s nárokem na poskytování jazykové přípravy")).toBe(true);
  });

  it("sekce 09 vrací tabulky 9.1, 9.2 a 9.3 včetně detailních popisů projektů", () => {
    const section09 = createDefaultSection09Data();
    section09.schoolEvents = [{ title: "Den školy", dateOrPeriod: "05/2025", publicEvent: "ANO" }];
    section09.competitions = [{ title: "Matematická olympiáda", level: "krajská" }];
    section09.projectsAndCooperation = [{ title: "Erasmus+", type: "projekt", description: "Mezinárodní spolupráce", output: "Výstupy" }];
    section09.publicPresentation.description = "Škola prezentuje výsledky na webu.";
    const blocks = getStructuredDocxBlocksForSection("09", { section09Data: section09 });
    expect(blocks.some((block) => block.type === "heading" && block.text === "9.1 Akce školy")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "9.2 Účast žáků na soutěžích")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "9.3 Projekty, spolupráce a prezentace školy na veřejnosti")).toBe(true);
    const projectTable = blocks.find(
      (block) => block.type === "table" && block.headers[0] === "Název",
    );
    expect(projectTable?.type).toBe("table");
    if (projectTable && projectTable.type === "table") {
      expect(projectTable.headers).toEqual(["Název", "Typ", "Partner", "Období", "Výstup"]);
      expect(projectTable.rows[0]?.length).toBe(5);
    }
    expect(blocks.some((block) => block.type === "paragraph" && block.text.includes("Popis projektu „Erasmus+“"))).toBe(true);
    expect(blocks.some((block) => block.type === "table" && block.headers[0] === "Oblast")).toBe(true);
  });

  it("sekce 11 vrací tabulky 11.3 až 11.6 a zachová varování", () => {
    const section11 = createDefaultSection11Data();
    section11.grantsAndSubsidies = [{ title: "Šablony", amount: 350000, usedAmount: 120000 }];
    section11.supplementaryActivity.carriedOut = "ANO";
    section11.supplementaryActivity.revenue = 95000;
    section11.supplementaryActivity.expenses = 70000;
    section11.supplementaryActivity.result = 25000;
    section11.investmentsAndRepairs = [{ title: "Interaktivní tabule", amount: 180000 }];
    section11.summaryCommentary = "Rozpočet byl stabilní.";
    section11.economicResult.profitOrLoss = -5000;
    section11.economicResult.mainActivityResult = -3000;

    const blocks = getStructuredDocxBlocksForSection("11", { section11Data: section11 });
    expect(blocks.some((block) => block.type === "heading" && block.text === "11.3 Dotace, granty a projekty")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "11.4 Doplňková činnost")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "11.5 Investice, opravy a větší nákupy")).toBe(true);
    expect(blocks.some((block) => block.type === "heading" && block.text === "11.6 Souhrnný komentář k hospodaření školy")).toBe(true);
    const commentaryTable = blocks.find(
      (block) =>
        block.type === "table" &&
        block.headers[0] === "Položka" &&
        block.rows.some((row) => row[0] === "Souhrnný komentář"),
    );
    expect(commentaryTable?.type).toBe("table");
    if (!commentaryTable || commentaryTable.type !== "table") return;
    expect(
      commentaryTable.rows.some((row) => row[1] === "Hospodářský výsledek: záporná hodnota vyžaduje ověření."),
    ).toBe(true);
  });
});
