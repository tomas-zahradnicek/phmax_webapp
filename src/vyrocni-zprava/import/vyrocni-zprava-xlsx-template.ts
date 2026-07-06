import type ExcelJSNamespace from "exceljs";
import { assertAnnualReportXlsxTemplateConfig } from "./vyrocni-zprava-xlsx-template-config";
import { createEmptyExcelJsWorkbook } from "./vyrocni-zprava-xlsx-exceljs";

export {
  ANNUAL_REPORT_XLSX_IMPORT_CONFIG_ERROR,
  ANNUAL_REPORT_XLSX_TEMPLATE_CONFIG,
  ANNUAL_REPORT_XLSX_UPLOAD_ERROR,
  assertAnnualReportXlsxTemplateConfig,
  getAnnualReportXlsxTemplateConfig,
  getVyrocniZpravaTemplateSheetNames,
  VYROCNI_ZPRAVA_XLSX_TEMPLATE_FILENAME,
} from "./vyrocni-zprava-xlsx-template-config";
export { loadExcelJsModule } from "./vyrocni-zprava-xlsx-exceljs";
function addReadmeSheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("README");
  sheet.getColumn(1).width = 130;
  const lines = [
    "Import údajů do modulu Výroční zprávy (XLSX v2)",
    "",
    "- vyplňujte pouze připravená pole",
    "- nepřejmenovávejte listy",
    "- nepřejmenovávejte hlavičky sloupců",
    "- prázdné buňky se považují za chybějící hodnoty",
    "- import nejprve zobrazí náhled před uložením",
    "- stávající data se nepřepíšou bez potvrzení",
    "- generated text se importem automaticky nemění",
    "- po importu zkontrolujte dotčené kapitoly a znovu vygenerujte návrh",
    "- čísla lze zadat českým zápisem, např. 1,18 nebo 4 200 000",
    "- sekce 05.2 podporuje jednoduchý weeklyHourPlan i rozšířený advancedCurriculumPlan",
  ];

  for (const line of lines) {
    const row = sheet.addRow([line]);
    if (line === "Import údajů do modulu Výroční zprávy (XLSX v2)") {
      row.getCell(1).font = { bold: true, size: 13, color: { argb: "FF0F172A" } };
    }
  }
}

function addProfileSheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("Profil školy");
  sheet.columns = [{ width: 34 }, { width: 64 }];
  sheet.addRow(["pole", "hodnota"]);

  const keys = [
    "name",
    "ico",
    "redIzo",
    "izo",
    "schoolType",
    "address",
    "municipality",
    "region",
    "founder",
    "principalName",
    "website",
    "email",
    "phone",
    "dataBox",
  ];
  for (const key of keys) {
    sheet.addRow([key, ""]);
  }
}

function addSection04Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("04 Zápis a žáci");
  sheet.columns = [{ width: 34 }, { width: 34 }, { width: 28 }, { width: 24 }, { width: 40 }];
  sheet.addRow(["blok", "pole", "trida_nebo_kategorie", "hodnota", "poznamka"]);
  sheet.addRow(["firstGradeAdmissionCurrentYear", "firstTimeTotal", "", "28", ""]);
  sheet.addRow(["firstGradeAdmissionCurrentYear", "firstTimeGirls", "", "13", ""]);
  sheet.addRow(["pupilsAdmittedDuringYear", "count", "2. ročník", "2", ""]);
  sheet.addRow(["pupilCountsSeptember", "boys", "1.A", "15", ""]);
  sheet.addRow(["pupilCountsSeptember", "girls", "1.A", "14", ""]);
  sheet.addRow(["pupilCountsSeptember", "total", "1.A", "29", ""]);
  sheet.addRow(["pupilCountsSeptember", "classTeacher", "1.A", "Mgr. Eva Králová", ""]);
}

function addSection01Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("01 Základní údaje");
  sheet.columns = [{ width: 38 }, { width: 72 }, { width: 40 }];
  sheet.addRow(["pole", "hodnota", "poznamka"]);
  sheet.addRow(["schoolCharacteristic", "Základní škola s rozšířenou výukou jazyků.", ""]);
  sheet.addRow(["schoolParts", "Školní družina, školní jídelna.", ""]);
  sheet.addRow(["schoolCapacity", "Kapacita školy 540 žáků.", ""]);
  sheet.addRow([
    "materialTechnicalConditions",
    "Škola disponuje dvěma budovami, učebnami, tělocvičnou, knihovnou a počítačovou učebnou.",
    "",
  ]);
  sheet.addRow(["schoolCouncilInfo", "Školská rada má 6 členů.", ""]);
  sheet.addRow(["schoolLeadershipInfo", "Ředitelka školy Mgr. Jana Nováková.", ""]);
  sheet.addRow(["remoteAccessInfo", "Web, Bakaláři, konzultační hodiny.", ""]);
}

function addSection02Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("02 Obory vzdělání");
  sheet.columns = [{ width: 10 }, { width: 16 }, { width: 40 }, { width: 20 }, { width: 20 }, { width: 28 }, { width: 28 }, { width: 24 }, { width: 30 }];
  sheet.addRow(["poradi", "code", "name", "form", "level", "note", "registrySource", "registryVerifiedAt", "notes"]);
  sheet.addRow(["1", "79-01-C/01", "Základní vzdělávání", "denní", "základní", "", "Rejstřík škol MŠMT", "2026-06-27", ""]);
}

function addSection03Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("03 Personální údaje");
  sheet.columns = [{ width: 24 }, { width: 26 }, { width: 24 }, { width: 20 }, { width: 30 }];
  sheet.addRow(["blok", "kategorie", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["basicStaff", "teachers", "physicalPersons", "18", ""]);
  sheet.addRow(["basicStaff", "teachers", "fte", "16,80", ""]);
  sheet.addRow(["ageGender", "under35", "male", "2", ""]);
  sheet.addRow(["ageGender", "under35", "female", "5", ""]);
  sheet.addRow(["educationGender", "university", "male", "7", ""]);
  sheet.addRow(["educationGender", "university", "female", "20", ""]);
  sheet.addRow(["qualification", "primaryTeacher", "qualified", "10", ""]);
}

function addSection05Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("05 ŠVP");
  sheet.columns = [
    { width: 24 },
    { width: 10 },
    { width: 28 },
    { width: 26 },
    { width: 32 },
    { width: 30 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
  ];
  sheet.addRow([
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
  sheet.addRow(["educationProgram", "", "", "name", "ŠVP Škola pro život", ""]);
  sheet.addRow(["schoolCurriculumPlan", "", "", "description", "Učební plán vychází z RVP ZV.", ""]);
  sheet.addRow(["weeklyHourPlan", "1", "Český jazyk", "grade1", "9", ""]);
  sheet.addRow(["advancedCurriculumPlan", "1", "", "", "", "", "Jazyk a jazyková komunikace", "Český jazyk a literatura", "", "7+2", "6+1", "6+1", "5+2", "5+2", "29+8", "4+1", "4+1", "4+1", "4+1", "16+4", "NE"]);
  sheet.addRow(["advancedCurriculumPlan", "2", "", "", "", "", "", "Cizí jazyk", "Německý jazyk; Ruský jazyk", "", "", "", "", "", "", "3", "3", "3", "3", "12", "NE"]);
  sheet.addRow(["advancedCurriculumPlan", "3", "", "", "", "", "Celkem hodin", "", "", "", "", "", "", "", "102+16", "", "", "", "", "104+18", "ANO"]);
  sheet.addRow(["goalsEvaluation", "1", "Čtenářská gramotnost", "level", "VETSINA_HODIN", ""]);
  sheet.addRow(["goalsEvaluation", "1", "Čtenářská gramotnost", "evidence", "Projektové dny.", ""]);
  sheet.addRow(["summary", "", "", "overallEvaluation", "Naplnění ŠVP probíhá standardně.", ""]);
}

function addSection06Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("06 Výsledky vzdělávání");
  sheet.columns = [{ width: 24 }, { width: 16 }, { width: 22 }, { width: 28 }, { width: 26 }, { width: 40 }];
  sheet.addRow(["blok", "pololeti", "trida", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["classResults", "first", "Celkem školy", "pupilsTotal", "304", ""]);
  sheet.addRow(["classResults", "first", "Celkem školy", "averageGrade", "1,52", ""]);
  sheet.addRow(["classResults", "first", "1. stupeň", "excusedAbsencePerPupil", "65", "volitelné"]);
  sheet.addRow(["classResults", "first", "2. stupeň", "excusedAbsencePerPupil", "72", "volitelné"]);
  sheet.addRow(["classResults", "second", "Celkem školy", "averageGrade", "1,48", ""]);
  sheet.addRow(["classResults", "second", "1. stupeň", "excusedAbsencePerPupil", "67", "volitelné"]);
  sheet.addRow(["classResults", "second", "2. stupeň", "excusedAbsencePerPupil", "74", "volitelné"]);
  sheet.addRow(["educationalMeasures", "first", "", "classTeacherPraise", "34", ""]);
  sheet.addRow(["summary", "", "", "summaryEvaluation", "Souhrnné vyhodnocení kapitoly 06.", ""]);
}

function addSection07Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("07 Prevence a podpora");
  sheet.columns = [{ width: 24 }, { width: 10 }, { width: 24 }, { width: 32 }, { width: 32 }, { width: 30 }];
  sheet.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["prevention", "", "", "preventionStrategyDescription", "Škola realizuje minimální preventivní program.", ""]);
  sheet.addRow(["preventionProgrammes", "1", "", "title", "Adaptační kurz 6. ročníků", ""]);
  sheet.addRow(["riskBehaviourIncidents", "1", "kybersikana", "count", "2", ""]);
  sheet.addRow(["pupilsWithSupportNeeds", "", "", "pupilsWithSvpTotal", "54", ""]);
  sheet.addRow(["supportConditions", "", "", "supportMeasuresDescription", "Podpůrná opatření dle doporučení PPP.", ""]);
  sheet.addRow(["languagePreparation", "", "", "languagePreparationProvided", "ANO", ""]);
  sheet.addRow(["summary", "", "", "summaryEvaluation", "Podpora je nastavena funkčně.", ""]);
}

function addSection08Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("08 DVPP a rozvoj pracovníků");
  sheet.columns = [{ width: 28 }, { width: 10 }, { width: 26 }, { width: 28 }, { width: 32 }, { width: 30 }];
  sheet.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["dvppOverview", "", "", "description", "DVPP dle ročního plánu školy.", ""]);
  sheet.addRow(["qualificationStudies", "1", "", "title", "Studium výchovného poradenství", ""]);
  sheet.addRow(["professionalDevelopmentTrainings", "1", "", "hours", "16", ""]);
  sheet.addRow(["nonTeachingStaffDevelopment", "1", "", "title", "BOZP školení provozních zaměstnanců", ""]);
  sheet.addRow(["selfStudy", "", "", "description", "Samostudium metodik inkluze.", ""]);
  sheet.addRow(["summary", "", "", "summaryEvaluation", "Rozvoj pracovníků probíhá průběžně.", ""]);
}

function addSection09Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("09 Aktivity a prezentace");
  sheet.columns = [{ width: 28 }, { width: 10 }, { width: 24 }, { width: 28 }, { width: 32 }, { width: 30 }];
  sheet.addRow(["blok", "poradi", "kategorie", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["publicPresentation", "", "", "description", "Škola pravidelně publikuje aktuality.", ""]);
  sheet.addRow(["schoolEvents", "1", "", "title", "Den otevřených dveří", ""]);
  sheet.addRow(["competitions", "1", "", "title", "Matematická olympiáda", ""]);
  sheet.addRow(["projectsAndCooperation", "1", "", "title", "Erasmus+ partnerství", ""]);
  sheet.addRow(["summary", "", "", "summaryEvaluation", "Kapitola shrnuje klíčové aktivity.", ""]);
}

function addSection10Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("10 ČŠI");
  sheet.columns = [{ width: 24 }, { width: 10 }, { width: 28 }, { width: 36 }, { width: 32 }];
  sheet.addRow(["blok", "poradi", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["status", "", "inspectionActivityStatus", "NEUVEDENO", ""]);
  sheet.addRow(["inspections", "1", "dateOrPeriod", "2025/2026", ""]);
  sheet.addRow(["inspections", "1", "subject", "Podmínky vzdělávání", ""]);
  sheet.addRow(["summary", "", "summaryEvaluation", "Souhrnné vyhodnocení zjištění ČŠI.", ""]);
}

function addSection12Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("12 Projekty a granty");
  sheet.columns = [{ width: 28 }, { width: 10 }, { width: 24 }, { width: 48 }, { width: 30 }];
  sheet.addRow(["blok", "poradi", "pole", "hodnota", "poznamka"]);
  sheet.addRow(["projects", "1", "title", "Projekt Digitální škola", ""]);
  sheet.addRow(["projects", "1", "description", "Modernizace ICT vybavení a podpora digitálních kompetencí.", ""]);
  sheet.addRow(["projects", "1", "provider", "MŠMT", ""]);
  sheet.addRow(["projects", "1", "amount", "350 000 Kč", ""]);
  sheet.addRow(["projects", "1", "focusAreas", "digitální vzdělávání", ""]);
  sheet.addRow(["otherPrograms", "", "", "Škola se zapojila do programu Čtenářská gramotnost.", ""]);
  sheet.addRow(["summary", "", "summaryEvaluation", "Projekty přispěly k rozvoji vzdělávání.", ""]);
}

function addSection13Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("13 Spolupráce s rodiči");
  sheet.columns = [{ width: 38 }, { width: 72 }, { width: 40 }];
  sheet.addRow(["pole", "hodnota", "poznamka"]);
  sheet.addRow(["parentCooperation", "Pravidelná setkání s rodiči probíhala formou třídních schůzek a konzultací.", ""]);
  sheet.addRow(["founderCooperation", "Zřizovatel projednal výroční zprávu na zasedání zastupitelstva.", ""]);
  sheet.addRow(["partners", "Škola spolupracovala s knihovnou, sportovním klubem a obcí.", ""]);
  sheet.addRow(["summaryEvaluation", "Spolupráce s rodiči a partnery byla v průběhu roku aktivní.", ""]);
}

function addSection14Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("14 Závěr");
  sheet.columns = [{ width: 38 }, { width: 72 }, { width: 40 }];
  sheet.addRow(["pole", "hodnota", "poznamka"]);
  sheet.addRow([
    "overallEvaluation",
    "Ve školním roce 2024/2025 škola plnila cíle ŠVP, podporovala rozvoj žáků a udržovala spolupráci s rodiči i partnery.",
    "",
  ]);
  sheet.addRow([
    "futurePlans",
    "Další rozvoj digitálních kompetencí, podpora prevence rizikového chování a zkvalitnění materiálně-technického zázemí.",
    "",
  ]);
}

function addPublicationSheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("Schválení a zveřejnění");
  sheet.columns = [{ width: 42 }, { width: 72 }];
  sheet.addRow(["pole", "hodnota"]);
  sheet.addRow(["discussedByPedagogicalCouncilDate", "10. 6. 2025"]);
  sheet.addRow(["approvedBySchoolCouncilDate", "18. 6. 2025"]);
  sheet.addRow(["sentToFounderDate", "25. 6. 2025"]);
  sheet.addRow(["publishedRemotelyDate", "1. 7. 2025"]);
  sheet.addRow(["placeAndDate", "Nové Město dne 20. 6. 2025"]);
  sheet.addRow(["principalSignature", "Mgr. Jan Novák"]);
  sheet.addRow(["schoolCouncilChairSignature", "Ing. Petr Novotný"]);
}

function addSection11Sheet(workbook: ExcelJSNamespace.Workbook): void {
  const sheet = workbook.addWorksheet("11 Hospodaření");
  sheet.columns = [{ width: 28 }, { width: 30 }, { width: 34 }, { width: 26 }, { width: 40 }];
  sheet.addRow(["blok", "polozka", "nazev_radku", "hodnota", "poznamka"]);
  sheet.addRow(["reportingPeriod", "reportingPeriod", "", "kalendářní rok 2024", ""]);
  sheet.addRow(["revenue", "stateBudgetContribution", "", "18 500 000", ""]);
  sheet.addRow(["revenue", "founderContribution", "", "4 200 000", ""]);
  sheet.addRow(["expenses", "salaryCosts", "", "15 200 000", ""]);
  sheet.addRow(["economicResult", "profitOrLoss", "", "-1 795 000", ""]);
  sheet.addRow(["grantsAndSubsidies", "provider", "Digitalizace školy", "MŠMT", ""]);
  sheet.addRow(["grantsAndSubsidies", "amount", "Digitalizace školy", "350 000", ""]);
  sheet.addRow(["investmentsAndRepairs", "amount", "Oprava sociálního zařízení", "310 000", ""]);
  sheet.addRow(["summary", "summaryCommentary", "", "Souhrnný komentář k hospodaření.", ""]);
}

/** Sestaví workbook importní šablony výroční zprávy. */
export async function buildVyrocniZpravaImportTemplateWorkbook(): Promise<ExcelJSNamespace.Workbook> {
  assertAnnualReportXlsxTemplateConfig();
  const workbook = await createEmptyExcelJsWorkbook();
  workbook.creator = "Ředitelský průvodce";
  workbook.created = new Date();
  addReadmeSheet(workbook);
  addProfileSheet(workbook);
  addSection01Sheet(workbook);
  addSection02Sheet(workbook);
  addSection03Sheet(workbook);
  addSection04Sheet(workbook);
  addSection05Sheet(workbook);
  addSection06Sheet(workbook);
  addSection07Sheet(workbook);
  addSection08Sheet(workbook);
  addSection09Sheet(workbook);
  addSection10Sheet(workbook);
  addSection11Sheet(workbook);
  addSection12Sheet(workbook);
  addSection13Sheet(workbook);
  addSection14Sheet(workbook);
  addPublicationSheet(workbook);

  return workbook;
}

export async function downloadVyrocniZpravaImportTemplateXlsx(): Promise<void> {
  const config = assertAnnualReportXlsxTemplateConfig();
  const workbook = await buildVyrocniZpravaImportTemplateWorkbook();
  if (!workbook.xlsx?.writeBuffer) {
    throw new Error("Konfiguraci XLSX importu se nepodařilo načíst.");
  }
  const buffer = await workbook.xlsx.writeBuffer();  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = config.filename;
  document.body.appendChild(a);  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
