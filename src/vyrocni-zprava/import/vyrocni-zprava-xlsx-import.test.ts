import { describe, expect, it, vi } from "vitest";
import { createDefaultSchoolProfile } from "../../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "../vyrocni-zprava-logic";
import { createDefaultPersonnelData } from "../vyrocni-zprava-personnel-logic";
import { createDefaultSection01Data } from "../vyrocni-zprava-section01-data-logic";
import { createDefaultSection02Data } from "../vyrocni-zprava-section02-data-logic";
import { createDefaultSection04Data } from "../vyrocni-zprava-section04-data-logic";
import { createDefaultSection05Data } from "../vyrocni-zprava-section05-data-logic";
import { createDefaultSection06Data } from "../vyrocni-zprava-section06-data-logic";
import { createDefaultSection07Data } from "../vyrocni-zprava-section07-data-logic";
import { createDefaultSection08Data } from "../vyrocni-zprava-section08-data-logic";
import { createDefaultSection09Data } from "../vyrocni-zprava-section09-data-logic";
import { createDefaultSection10Data } from "../vyrocni-zprava-section10-data-logic";
import { createDefaultSection11Data } from "../vyrocni-zprava-section11-data-logic";
import { createDefaultSection12Data } from "../vyrocni-zprava-section12-data-logic";
import { createDefaultSection13Data } from "../vyrocni-zprava-section13-data-logic";
import { createDefaultSection14Data } from "../vyrocni-zprava-section14-data-logic";
import {
  buildImportPreviewSummary,
  canConfirmImport,
} from "./vyrocni-zprava-xlsx-import-preview";
import {
  parseVyrocniZpravaImportArrayBuffer,
} from "./vyrocni-zprava-xlsx-import-logic";
import {
  buildVyrocniZpravaImportTemplateWorkbook,
  getVyrocniZpravaTemplateSheetNames,
} from "./vyrocni-zprava-xlsx-template";
import {
  ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR,
  ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG,
  ANNUAL_REPORT_XLSX_UPLOAD_ERROR,
  assertAnnualReportXlsxTemplateConfig,
  getAnnualReportXlsxTemplateConfig,
  validateAnnualReportXlsxTemplateConfig,
} from "./vyrocni-zprava-xlsx-template-config";
import { loadExcelJsModule } from "./vyrocni-zprava-xlsx-exceljs";

type Workbook = import("exceljs").Workbook;

async function createWorkbookWithRequiredSheets(): Promise<Workbook> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();

  const readme = workbook.addWorksheet("README");
  readme.addRow(["README"]);

  const profile = workbook.addWorksheet("Profil školy");
  profile.addRow(["pole", "hodnota"]);
  profile.addRow(["name", "ZŠ Test"]);

  const s04 = workbook.addWorksheet("04 Zápis a žáci");
  s04.addRow(["blok", "pole", "trida_nebo_kategorie", "hodnota", "poznamka"]);

  const s06 = workbook.addWorksheet("06 Výsledky vzdělávání");
  s06.addRow(["blok", "pololeti", "trida", "pole", "hodnota", "poznamka"]);

  const s11 = workbook.addWorksheet("11 Hospodaření");
  s11.addRow(["blok", "polozka", "nazev_radku", "hodnota", "poznamka"]);

  return workbook;
}

function createExistingData() {
  return {
    schoolProfile: createDefaultSchoolProfile(),
    section01Data: createDefaultSection01Data(),
    section02Data: createDefaultSection02Data(),
    section03Data: createDefaultPersonnelData(),
    section04Data: createDefaultSection04Data(),
    section05Data: createDefaultSection05Data(),
    section06Data: createDefaultSection06Data(),
    section07Data: createDefaultSection07Data(),
    section08Data: createDefaultSection08Data(),
    section09Data: createDefaultSection09Data(),
    section10Data: createDefaultSection10Data(),
    section11Data: createDefaultSection11Data(),
    section12Data: createDefaultSection12Data(),
    section13Data: createDefaultSection13Data(),
    section14Data: createDefaultSection14Data(),
  };
}

async function parseWorkbook(workbook: Workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return parseVyrocniZpravaImportArrayBuffer(buffer as ArrayBuffer, {
    currentProfile: createDefaultSchoolProfile(),
    sourceFileName: "test.xlsx",
  });
}

describe("vyrocni-zprava-xlsx-import", () => {
  it("template obsahuje všechny listy v2", async () => {
    const workbook = await buildVyrocniZpravaImportTemplateWorkbook();
    const names = workbook.worksheets.map((sheet) => sheet.name);
    expect(names).toEqual(getVyrocniZpravaTemplateSheetNames());
  });

  it("README obsahuje informaci, že generatedText se nemění", async () => {
    const workbook = await buildVyrocniZpravaImportTemplateWorkbook();
    const sheet = workbook.getWorksheet("README")!;
    const lines = Array.from({ length: sheet.rowCount }, (_, index) => String(sheet.getRow(index + 1).getCell(1).value ?? ""));
    expect(lines.some((line) => line.toLowerCase().includes("generated text"))).toBe(true);
  });

  it("chybějící povinný list vrátí error", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    workbook.removeWorksheet("11 Hospodaření");
    const result = await parseWorkbook(workbook);
    expect(result.errors.some((item) => item.message.includes("Chybí povinný list '11 Hospodaření'"))).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("chybějící hlavička vrátí error", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const sheet = workbook.getWorksheet("06 Výsledky vzdělávání")!;
    sheet.getRow(1).values = [undefined, "blok", "pololeti", "trida", "pole", "hodnota"];
    const result = await parseWorkbook(workbook);
    expect(result.errors.some((item) => item.message.includes("Chybí povinné hlavičky"))).toBe(true);
  });

  it("profil školy se parsuje do patch", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const profile = workbook.getWorksheet("Profil školy")!;
    profile.addRow(["ico", "12345678"]);
    profile.addRow(["founder", "Město"]);
    const result = await parseWorkbook(workbook);
    expect(result.profilePatch?.name).toBe("ZŠ Test");
    expect(result.profilePatch?.ico).toBe("12345678");
    expect(result.profilePatch?.founder).toBe("Město");
  });

  it("sekce 04 parsuje řádek třídy správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s04 = workbook.getWorksheet("04 Zápis a žáci")!;
    s04.addRow(["pupilCountsSeptember", "boys", "1.A", "15", ""]);
    s04.addRow(["pupilCountsSeptember", "girls", "1.A", "14", ""]);
    s04.addRow(["pupilCountsSeptember", "total", "1.A", "29", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section04Data?.pupilCountsSeptember[0]).toMatchObject({
      className: "1.A",
      boys: 15,
      girls: 14,
      total: 29,
    });
  });

  it("sekce 04 secondarySchoolAdmissions mapuje známé kategorie bez duplicit", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s04 = workbook.getWorksheet("04 Zápis a žáci")!;
    s04.addRow(["secondarySchoolAdmissions", "", "víceleté gymnázium", "-", ""]);
    s04.addRow(["secondarySchoolAdmissions", "", "Víceleté gymnázium", "2", ""]);
    s04.addRow(["secondarySchoolAdmissions", "", "Jiná škola", "1", ""]);
    const result = await parseWorkbook(workbook);
    const admissions = result.section04Data?.secondarySchoolAdmissions ?? [];
    const vicelete = admissions.filter((item) => item.schoolType === "víceleté gymnázium");
    expect(vicelete).toHaveLength(1);
    expect(vicelete[0]?.count).toBe(2);
    expect(admissions.some((item) => item.schoolType === "Jiná škola" && item.count === 1)).toBe(true);
  });

  it("sekce 06 averageGrade 1,18 se parsuje jako 1.18", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s06 = workbook.getWorksheet("06 Výsledky vzdělávání")!;
    s06.addRow(["classResults", "first", "1.A", "pupilsTotal", "29", ""]);
    s06.addRow(["classResults", "first", "1.A", "averageGrade", "1,18", ""]);
    s06.addRow(["classResults", "second", "1.A", "pupilsTotal", "29", ""]);
    s06.addRow(["classResults", "second", "1.A", "averageGrade", "1,16", ""]);
    s06.addRow(["summary", "", "", "summaryEvaluation", "Souhrn dat.", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section06Data?.firstTermClassResults[0]?.averageGrade).toBe(1.18);
    expect(result.section06Data?.secondTermClassResults[0]?.averageGrade).toBe(1.16);
    expect(result.warnings.some((item) => /průměrná známka/i.test(item.message))).toBe(false);
  });

  it("sekce 11 částka 4 200 000 se parsuje jako 4200000", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s11 = workbook.getWorksheet("11 Hospodaření")!;
    s11.addRow(["revenue", "founderContribution", "", "4 200 000", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section11Data?.revenue.founderContribution).toBe(4200000);
  });

  it("nevalidní číslo vytvoří warning a není převedeno na 0", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s11 = workbook.getWorksheet("11 Hospodaření")!;
    s11.addRow(["revenue", "founderContribution", "", "abc", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.warnings.some((item) => item.message.includes("není validní číslo"))).toBe(true);
    expect(result.section11Data?.revenue.founderContribution).toBeUndefined();
  });

  it("neznámý list a neznámé pole jsou ignorované", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const unknown = workbook.addWorksheet("Neznámý list");
    unknown.addRow(["x"]);
    const s04 = workbook.getWorksheet("04 Zápis a žáci")!;
    s04.addRow(["firstGradeAdmissionCurrentYear", "unknownField", "", "2", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.ignored.some((item) => item.message.includes("není podporován"))).toBe(true);
    expect(result.ignored.some((item) => item.message.includes("Neznámé pole"))).toBe(true);
  });

  it("import s chybami nelze potvrdit", () => {
    const fakeResult = {
      valid: false,
      importedAt: new Date().toISOString(),
      detectedSheets: [],
      errors: [{ message: "chyba" }],
      warnings: [],
      ignored: [],
      section04Data: undefined,
      section06Data: undefined,
      section11Data: undefined,
    };
    expect(canConfirmImport(fakeResult, true, createExistingData())).toBe(false);
  });

  it("import s warningy lze potvrdit po overwrite potvrzení", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const result = await parseWorkbook(workbook);
    expect(canConfirmImport(result, false, createExistingData())).toBe(false);
    expect(canConfirmImport(result, true, createExistingData())).toBe(true);
  });

  it("overwrite vyžaduje explicitní potvrzení", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const existing = createExistingData();
    existing.schoolProfile.name = "ZŠ Existující";
    const result = await parseWorkbook(workbook);
    const summaryWithoutConfirm = buildImportPreviewSummary(result, existing, false);
    const summaryWithConfirm = buildImportPreviewSummary(result, existing, true);
    expect(summaryWithoutConfirm.canConfirm).toBe(false);
    expect(summaryWithConfirm.canConfirm).toBe(true);
    expect(summaryWithConfirm.overwriteTargets).toEqual(["Profil školy"]);
  });

  it("upozorní na přepis ručně upravené nebo schválené kapitoly", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s06 = workbook.getWorksheet("06 Výsledky vzdělávání")!;
    s06.addRow(["classResults", "first", "Celkem školy", "pupilsTotal", "304", ""]);
    const result = await parseWorkbook(workbook);
    const existing = createExistingData();
    existing.section06Data.firstTermClassResults = [{ className: "Celkem školy", pupilsTotal: 300 }];
    const summary = buildImportPreviewSummary(result, {
      ...existing,
      sectionStatuses: { "06": "UPRAVENO_UZIVATELEM" },
    }, true);
    expect(summary.manualOverwriteWarnings).toEqual(["06 (ručně upravená kapitola)"]);
  });

  it("import nemění generatedText výroční zprávy", async () => {
    const report = createDefaultAnnualReport("2024/2025");
    const section06Before = report.sections.find((item) => item.id === "06")!;
    const workbook = await createWorkbookWithRequiredSheets();
    const s06 = workbook.getWorksheet("06 Výsledky vzdělávání")!;
    s06.addRow(["summary", "", "", "summaryEvaluation", "Souhrn dat.", ""]);
    const parsed = await parseWorkbook(workbook);
    expect(parsed.section06Data).toBeDefined();
    const section06After = report.sections.find((item) => item.id === "06")!;
    expect(section06After.generatedText).toBe(section06Before.generatedText);
    expect(section06After.originalGeneratedText).toBe(section06Before.originalGeneratedText);
  });

  it("import nemění approved status kapitol", async () => {
    const report = createDefaultAnnualReport("2024/2025");
    const before = report.sections.find((item) => item.id === "11")!;
    const workbook = await createWorkbookWithRequiredSheets();
    const s11 = workbook.getWorksheet("11 Hospodaření")!;
    s11.addRow(["revenue", "founderContribution", "", "4 200 000", ""]);
    await parseWorkbook(workbook);
    const after = report.sections.find((item) => item.id === "11")!;
    expect(after.approvedAt).toBe(before.approvedAt);
    expect(after.status).toBe(before.status);
  });

  it("v1 šablona bez volitelných listů 01/02/03/05/07/08/09/10/12/13/14 projde", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const result = await parseWorkbook(workbook);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("sekce 01 se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s01 = workbook.addWorksheet("01 Základní údaje");
    s01.addRow(["pole", "hodnota", "poznamka"]);
    s01.addRow(["schoolCharacteristic", "Charakteristika", ""]);
    s01.addRow(["schoolLeadershipInfo", "Vedení školy", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section01Data?.schoolCharacteristic).toBe("Charakteristika");
    expect(result.section01Data?.leadershipInfo).toBe("Vedení školy");
  });

  it("sekce 01 materialTechnicalConditions se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s01 = workbook.addWorksheet("01 Základní údaje");
    s01.addRow(["pole", "hodnota", "poznamka"]);
    s01.addRow(["materialTechnicalConditions", "Modernizované učebny a počítačová učebna.", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section01Data?.materialTechnicalConditions).toBe("Modernizované učebny a počítačová učebna.");
  });

  it("sekce 12 projekty se parsují správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s12 = workbook.addWorksheet("12 Projekty a granty");
    s12.addRow(["blok", "poradi", "pole", "hodnota", "poznamka"]);
    s12.addRow(["projects", "1", "title", "Projekt Digitální škola", ""]);
    s12.addRow(["projects", "1", "provider", "MŠMT", ""]);
    s12.addRow(["projects", "1", "amount", "350 000", ""]);
    s12.addRow(["otherPrograms", "", "", "Program Čtenářská gramotnost", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section12Data?.projects[0]).toMatchObject({ title: "Projekt Digitální škola", provider: "MŠMT" });
    expect(result.section12Data?.otherPrograms).toBe("Program Čtenářská gramotnost");
    expect(result.sectionReadiness["12"]).toBe("PRIPRAVENO");
  });

  it("sekce 13 spolupráce se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s13 = workbook.addWorksheet("13 Spolupráce s rodiči");
    s13.addRow(["pole", "hodnota", "poznamka"]);
    s13.addRow(["parentCooperation", "Třídní schůzky a konzultace.", ""]);
    s13.addRow(["founderCooperation", "Projednání na zastupitelstvu.", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section13Data?.parentCooperation).toBe("Třídní schůzky a konzultace.");
    expect(result.sectionReadiness["13"]).toBe("PRIPRAVENO");
  });

  it("sekce 14 závěr se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s14 = workbook.addWorksheet("14 Závěr");
    s14.addRow(["pole", "hodnota", "poznamka"]);
    s14.addRow([
      "overallEvaluation",
      "Ve školním roce 2024/2025 škola plnila cíle ŠVP a podporovala rozvoj žáků v souladu s plánem školy.",
      "",
    ]);
    s14.addRow(["futurePlans", "Rozvoj digitálních kompetencí a prevence rizikového chování.", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section14Data?.overallEvaluation).toContain("2024/2025");
    expect(result.section14Data?.futurePlans).toContain("digitálních kompetencí");
    expect(result.sectionReadiness["14"]).toBe("PRIPRAVENO");
  });

  it("sekce 02 se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s02 = workbook.addWorksheet("02 Obory vzdělání");
    s02.addRow(["poradi", "code", "name", "form", "level", "note", "registrySource", "registryVerifiedAt", "notes"]);
    s02.addRow(["1", "79-01-C/01", "Základní vzdělávání", "denní", "základní", "", "rejstřík", "2026-06-27", "pozn"]);
    const result = await parseWorkbook(workbook);
    expect(result.section02Data?.educationFields[0].name).toBe("Základní vzdělávání");
    expect(result.section02Data?.registrySource).toBe("rejstřík");
  });

  it("sekce 03 FTE 16,80 se parsuje jako 16.8", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s03 = workbook.addWorksheet("03 Personální údaje");
    s03.addRow(["blok", "kategorie", "pole", "hodnota", "poznamka"]);
    s03.addRow(["basicStaff", "teachers", "fte", "16,80", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section03Data?.staffCounts.teachersFte).toBe(16.8);
  });

  it("sekce 06 umí importovat volitelné agregáty 1. a 2. stupeň", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s06 = workbook.getWorksheet("06 Výsledky vzdělávání")!;
    s06.addRow(["classResults", "first", "1. stupeň", "excusedAbsencePerPupil", "67", ""]);
    s06.addRow(["classResults", "first", "2. stupeň", "excusedAbsencePerPupil", "74", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section06Data?.firstTermClassResults.some((row) => row.className === "1. stupeň")).toBe(true);
    expect(result.section06Data?.firstTermClassResults.some((row) => row.className === "2. stupeň")).toBe(true);
  });

  it("sekce 07 přijme languagePreparationProvided=NEUVEDENO bez warningu", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s07 = workbook.addWorksheet("07 Prevence a podpora");
    s07.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
    s07.addRow(["languagePreparation", "", "", "languagePreparationProvided", "NEUVEDENO", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section07Data?.languagePreparation.languagePreparationProvided).toBe("NEUVEDENO");
    expect(result.warnings.some((item) => item.message.includes("languagePreparationProvided"))).toBe(false);
  });

  it("sheet Schválení a zveřejnění se parsuje do publicationBlockPatch", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const publication = workbook.addWorksheet("Schválení a zveřejnění");
    publication.addRow(["pole", "hodnota"]);
    publication.addRow(["approvedBySchoolCouncilDate", "18. 6. 2025"]);
    publication.addRow(["principalSignature", "Mgr. Eva Králová"]);
    const result = await parseWorkbook(workbook);
    expect(result.publicationBlockPatch?.approvedBySchoolCouncilDate).toBe("18. 6. 2025");
    expect(result.publicationBlockPatch?.principalSignature).toBe("Mgr. Eva Králová");
  });

  it("sekce 05 goals se parsují správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s05 = workbook.addWorksheet("05 ŠVP");
    s05.addRow(["blok", "poradi", "predmet_nebo_cil", "pole", "hodnota", "poznamka"]);
    s05.addRow(["goalsEvaluation", "1", "Čtenářství", "level", "NEKTERE_HODINY", ""]);
    s05.addRow(["goalsEvaluation", "1", "Čtenářství", "evidence", "Projekt", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section05Data?.goalsEvaluation[0]).toMatchObject({ goal: "Čtenářství", level: "NEKTERE_HODINY" });
  });

  it("sekce 05 advancedCurriculumPlan se parsuje a weeklyHourPlan zůstává podporován", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s05 = workbook.addWorksheet("05 ŠVP");
    s05.addRow([
      "blok",
      "poradi",
      "predmet_nebo_cil",
      "pole",
      "hodnota",
      "poznamka",
      "vzdelavaci_oblast",
      "predmet",
      "detail_predmetu",
      "rocnik_1",
      "rocnik_2",
      "rocnik_3",
      "rocnik_4",
      "rocnik_5",
      "dotace_1_stupen",
      "rocnik_6",
      "rocnik_7",
      "rocnik_8",
      "rocnik_9",
      "dotace_2_stupen",
      "je_souctovy_radek",
    ]);
    s05.addRow(["weeklyHourPlan", "1", "Český jazyk", "grade1", "8", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    s05.addRow([
      "advancedCurriculumPlan",
      "1",
      "",
      "",
      "",
      "",
      "Jazyk a jazyková komunikace",
      "Český jazyk",
      "Německý jazyk; Ruský jazyk",
      "7+2",
      "6+1",
      "",
      "",
      "",
      "33+9",
      "4+1",
      "",
      "",
      "",
      "15+4",
      "NE",
    ]);
    s05.addRow([
      "advancedCurriculumPlan",
      "2",
      "",
      "",
      "",
      "",
      "Celkem hodin",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "102+16",
      "",
      "",
      "",
      "",
      "104+18",
      "ANO",
    ]);
    const result = await parseWorkbook(workbook);
    expect(result.section05Data?.schoolCurriculumPlan.weeklyHourPlan?.[0]?.subject).toBe("Český jazyk");
    expect(result.section05Data?.schoolCurriculumPlan.advancedCurriculumPlan?.rows[0]?.educationalArea).toBe("Jazyk a jazyková komunikace");
    expect(result.section05Data?.schoolCurriculumPlan.advancedCurriculumPlan?.rows[0]?.subjectDetails).toEqual(["Německý jazyk", "Ruský jazyk"]);
    expect(result.section05Data?.schoolCurriculumPlan.advancedCurriculumPlan?.rows[1]?.isTotalRow).toBe(true);
  });

  it("sekce 07 aggregate support data se parsují správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s07 = workbook.addWorksheet("07 Prevence a podpora");
    s07.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
    s07.addRow(["pupilsWithSupportNeeds", "", "", "pupilsWithSvpTotal", "54", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section07Data?.pupilsWithSupportNeeds.pupilsWithSvpTotal).toBe(54);
  });

  it("sekce 08 training rows se parsují správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s08 = workbook.addWorksheet("08 DVPP a rozvoj pracovníků");
    s08.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
    s08.addRow(["professionalDevelopmentTrainings", "1", "", "title", "Kurz", ""]);
    s08.addRow(["professionalDevelopmentTrainings", "1", "", "hours", "12", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section08Data?.professionalDevelopmentTrainings[0]).toMatchObject({ title: "Kurz", hours: 12 });
  });

  it("sekce 09 events/competitions/projects se parsují správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s09 = workbook.addWorksheet("09 Aktivity a prezentace");
    s09.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
    s09.addRow(["schoolEvents", "1", "", "title", "Den otevřených dveří", ""]);
    s09.addRow(["competitions", "1", "", "title", "Olympiáda", ""]);
    s09.addRow(["projectsAndCooperation", "1", "", "title", "Erasmus+", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section09Data?.schoolEvents[0].title).toBe("Den otevřených dveří");
    expect(result.section09Data?.competitions[0].title).toBe("Olympiáda");
    expect(result.section09Data?.projectsAndCooperation[0].title).toBe("Erasmus+");
  });

  it("sekce 10 NEPROBEHLA se parsuje správně", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const s10 = workbook.addWorksheet("10 ČŠI");
    s10.addRow(["blok", "poradi", "pole", "hodnota", "poznamka"]);
    s10.addRow(["status", "", "inspectionActivityStatus", "NEPROBEHLA", ""]);
    const result = await parseWorkbook(workbook);
    expect(result.section10Data?.inspectionActivityStatus).toBe("NEPROBEHLA");
  });

  it("import template config je definovaná a má neprázdné sheets", () => {
    expect(validateAnnualReportXlsxTemplateConfig(ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG)).toBe(true);
    expect(getAnnualReportXlsxTemplateConfig()?.sheets.length).toBeGreaterThan(0);
    expect(assertAnnualReportXlsxTemplateConfig().sheets.map((sheet) => sheet.name)).toEqual(
      getVyrocniZpravaTemplateSheetNames(),
    );
  });

  it("validateAnnualReportXlsxTemplateConfig odmítne neplatnou konfiguraci", () => {
    expect(validateAnnualReportXlsxTemplateConfig(undefined)).toBe(false);
    expect(validateAnnualReportXlsxTemplateConfig({ version: 2, filename: "x.xlsx", sheets: [] })).toBe(false);
  });

  it("05 ŠVP config obsahuje hlavičky advancedCurriculumPlan", () => {
    const sheet05 = assertAnnualReportXlsxTemplateConfig().sheets.find((sheet) => sheet.name === "05 ŠVP");
    expect(sheet05?.optionalHeaders).toContain("vzdelavaci_oblast");
    expect(sheet05?.optionalHeaders).toContain("je_souctovy_radek");
  });

  it("generovaný workbook používá ExcelJS worksheets, ne SheetJS sheets", async () => {
    const workbook = await buildVyrocniZpravaImportTemplateWorkbook();
    expect(Array.isArray(workbook.worksheets)).toBe(true);
    expect(workbook.worksheets.length).toBe(getVyrocniZpravaTemplateSheetNames().length);
    expect("sheets" in workbook).toBe(false);
    expect(workbook.xlsx?.writeBuffer).toBeTypeOf("function");
  });

  it("ExcelJS modul se načte s Workbook konstruktorem", async () => {
    const ExcelJS = await loadExcelJsModule();
    expect(typeof ExcelJS.Workbook).toBe("function");
  });

  it("poškozený buffer vrátí kontrolovanou chybu uploadu", async () => {
    const result = await parseVyrocniZpravaImportArrayBuffer(new ArrayBuffer(8), {
      currentProfile: createDefaultSchoolProfile(),
      sourceFileName: "broken.xlsx",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.message === ANNUAL_REPORT_XLSX_UPLOAD_ERROR)).toBe(true);
  });

  it("neplatná template config vrátí kontrolovanou chybu místo pádu", async () => {
    const workbook = await createWorkbookWithRequiredSheets();
    const buffer = await workbook.xlsx.writeBuffer();
    const configModule = await import("./vyrocni-zprava-xlsx-template-config");
    const spy = vi.spyOn(configModule, "assertAnnualReportXlsxTemplateConfig").mockImplementation(() => {
      throw new Error(ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR);
    });
    const result = await parseVyrocniZpravaImportArrayBuffer(buffer as ArrayBuffer, {
      currentProfile: createDefaultSchoolProfile(),
      sourceFileName: "template.xlsx",
    });
    spy.mockRestore();
    expect(result.valid).toBe(false);
    expect(result.errors.some((item) => item.message === ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR)).toBe(true);
  });
});
