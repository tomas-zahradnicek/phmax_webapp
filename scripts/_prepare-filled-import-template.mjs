import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { buildVyrocniZpravaImportTemplateWorkbook } from "../src/vyrocni-zprava/import/vyrocni-zprava-xlsx-template.ts";
import { parseVyrocniZpravaImportArrayBuffer } from "../src/vyrocni-zprava/import/vyrocni-zprava-xlsx-import-logic.ts";
import { createDefaultSchoolProfile } from "../src/school-profile/school-profile-logic.ts";

const SUMMARY_06 =
  "Výsledky vzdělávání lze hodnotit jako stabilní a odpovídající dlouhodobým výsledkům školy. Průměrný prospěch školy dosáhl v 1. pololetí 1,52 a ve 2. pololetí 1,48.";

const SUMMARY_07 =
  "Preventivní program byl zaměřen na prevenci šikany, kyberšikany, závislostí a podporu duševního zdraví. Všechny případy rizikového chování byly řešeny v souladu s metodickými doporučeními MŠMT.";

const SUMMARY_09 =
  "Ve školním roce 2024/2025 škola realizovala řadu vzdělávacích, sportovních, kulturních a společenských akcí, které přispěly k rozvoji osobnosti žáků a posílení vztahů mezi školou a veřejností.";

const SUMMARY_08 =
  "Pedagogičtí pracovníci absolvovali vzdělávací akce zaměřené na formativní hodnocení, digitální kompetence, práci se žáky se SVP a wellbeing ve škole. Celkem bylo realizováno 46 vzdělávacích akcí.";

const SUMMARY_11 =
  "Škola hospodařila v souladu se schváleným rozpočtem. Kladný hospodářský výsledek 330 000 Kč bude po schválení zřizovatelem převeden do rezervního fondu školy.";

const SUMMARY_05 =
  "Cíle školního vzdělávacího programu „Škola pro život“ byly naplňovány prostřednictvím moderních metod, projektového vyučování a digitálních technologií. V následujícím období škola bude rozvíjet digitální kompetence a wellbeing.";

const NO_INSPECTION =
  "Ve školním roce 2024/2025 nebyla ve škole provedena komplexní inspekční činnost České školní inspekce. Škola průběžně vycházela z doporučení předchozích inspekčních zjištění.";

function setProfileValues(sheet, entries) {
  for (const [key, value] of Object.entries(entries)) {
    for (let row = 2; row <= sheet.rowCount; row += 1) {
      if (String(sheet.getRow(row).getCell(1).value ?? "").trim() === key) {
        sheet.getRow(row).getCell(2).value = value;
        break;
      }
    }
  }
}

function replaceDataRows(sheet, rows) {
  for (let rowNumber = sheet.lastRow?.number ?? sheet.rowCount; rowNumber > 1; rowNumber -= 1) {
    sheet.spliceRows(rowNumber, 1);
  }
  for (const row of rows) {
    sheet.addRow(row);
  }
}

function addRows(sheet, rows) {
  for (const row of rows) {
    sheet.addRow(row);
  }
}

const admissionSummaryRows = (block, values) => [
  [block, "firstTimeTotal", "", values.firstTimeTotal, ""],
  [block, "firstTimeGirls", "", values.firstTimeGirls, ""],
  [block, "afterDeferralTotal", "", values.afterDeferralTotal, ""],
  [block, "afterDeferralGirls", "", values.afterDeferralGirls, ""],
  [block, "enrolledTotal", "", values.enrolledTotal, ""],
  [block, "enrolledGirls", "", values.enrolledGirls, ""],
  [block, "deferralRequestsTotal", "", values.deferralRequestsTotal, ""],
  [block, "deferralRequestsGirls", "", values.deferralRequestsGirls, ""],
];

const PUPIL_CLASSES = [
  ["1.A", 11, 10, 21],
  ["1.B", 10, 11, 21],
  ["2.A", 11, 10, 21],
  ["2.B", 10, 10, 20],
  ["3.A", 12, 10, 22],
  ["3.B", 11, 10, 21],
  ["4.A", 10, 11, 21],
  ["5.A", 12, 11, 23],
  ["6.A", 11, 11, 22],
  ["6.B", 12, 11, 23],
  ["7.A", 11, 10, 21],
  ["8.A", 12, 10, 22],
  ["9.A", 13, 9, 22],
  ["9.B", 13, 10, 23],
];

function pupilCountRows(block, classes) {
  const rows = [];
  for (const [className, boys, girls, total] of classes) {
    rows.push([block, "boys", className, String(boys), ""]);
    rows.push([block, "girls", className, String(girls), ""]);
    rows.push([block, "total", className, String(total), ""]);
  }
  return rows;
}

const workbook = await buildVyrocniZpravaImportTemplateWorkbook();

setProfileValues(workbook.getWorksheet("Profil školy"), {
  name: "Základní škola Komenského, příspěvková organizace",
  ico: "12345678",
  redIzo: "600123456",
  izo: "102345678",
  schoolType: "ZAKLADNI_SKOLA",
  address: "Komenského 125, 500 01 Nové Město",
  municipality: "Nové Město",
  region: "Královéhradecký",
  founder: "Město Nové Město, Náměstí Republiky 1, 500 01 Nové Město",
  principalName: "Mgr. Jan Novák",
  website: "https://www.zskomenskeho.cz",
  email: "info@zskomenskeho.cz",
  phone: "495 123 456",
  dataBox: "abcdefg",
});

replaceDataRows(workbook.getWorksheet("01 Základní údaje"), [
  [
    "schoolCharacteristic",
    "Základní škola Komenského je plně organizovanou městskou základní školou poskytující základní vzdělávání žákům 1.–9. ročníku. Ve školním roce 2024/2025 navštěvovalo školu 304 žáků v 14 třídách. Škola dlouhodobě usiluje o kvalitní vzdělávání s důrazem na čtenářskou a matematickou gramotnost, digitální kompetence, environmentální vzdělávání a bezpečné školní klima.",
    "",
  ],
  ["schoolParts", "Školní družina, školní jídelna, školní knihovna.", ""],
  ["schoolCapacity", "Kapacita školy 320 žáků, aktuálně 14 kmenových tříd.", ""],
  [
    "schoolCouncilInfo",
    "Školská rada pracovala ve školním roce 2024/2025 v souladu se školským zákonem. Složení: zřizovatel (3), pedagogičtí pracovníci (3), zákonné zástupce (3). Sešla se dvakrát – projednávala výroční zprávu, výsledky vzdělávání, rozvojové projekty a plán investic.",
    "",
  ],
  [
    "schoolLeadershipInfo",
    "Ředitel: Mgr. Jan Novák. Zástupkyně ředitele: Mgr. Petra Svobodová. Vedoucí školní družiny: Bc. Jana Dvořáková. Výchovný poradce: Mgr. Martin Černý. Metodik prevence: Mgr. Lucie Benešová. Koordinátor ICT: Mgr. Tomáš Král.",
    "",
  ],
  [
    "remoteAccessInfo",
    "Web www.zskomenskeho.cz, školní sociální sítě, informační systém pro rodiče (Bakaláři), městský zpravodaj.",
    "",
  ],
  [
    "materialTechnicalConditions",
    "Škola sídlí ve dvou propojených budovách na adrese Komenského 125. Disponuje 14 kmenovými učebnami, učebnou informatiky, tělocvičnou, knihovnou, jídelnou a školní družinou. V průběhu roku proběhla modernizace IT vybavení a interaktivní techniky financovaná z projektu OP JAK.",
    "",
  ],
]);

replaceDataRows(workbook.getWorksheet("02 Obory vzdělání"), [
  [
    "1",
    "79-01-C/01",
    "Základní škola",
    "denní",
    "základní",
    "Výuka probíhala podle ŠVP „Škola pro život“.",
    "Školský rejstřík MŠMT",
    "2025-09-30",
    "ŠVP byl průběžně aktualizován v návaznosti na RVP ZV.",
  ],
]);

replaceDataRows(workbook.getWorksheet("03 Personální údaje"), [
  ["basicStaff", "teachers", "physicalPersons", "22", ""],
  ["basicStaff", "teachers", "fte", "21,40", ""],
  ["basicStaff", "educators", "physicalPersons", "4", ""],
  ["basicStaff", "educators", "fte", "3,60", ""],
  ["basicStaff", "specialPedagogues", "physicalPersons", "1", ""],
  ["basicStaff", "specialPedagogues", "fte", "1,00", ""],
  ["basicStaff", "teachingAssistants", "physicalPersons", "4", ""],
  ["basicStaff", "teachingAssistants", "fte", "3,50", ""],
  ["basicStaff", "nonTeachingStaff", "physicalPersons", "8", ""],
  ["basicStaff", "nonTeachingStaff", "fte", "7,40", ""],
  ["ageGender", "under35", "male", "3", ""],
  ["ageGender", "under35", "female", "7", ""],
  ["ageGender", "age36to45", "male", "2", ""],
  ["ageGender", "age36to45", "female", "7", ""],
  ["ageGender", "age46to55", "male", "4", ""],
  ["ageGender", "age46to55", "female", "5", ""],
  ["ageGender", "over55", "male", "1", ""],
  ["ageGender", "over55", "female", "2", ""],
  ["ageGender", "retirementAge", "male", "0", ""],
  ["ageGender", "retirementAge", "female", "0", ""],
  ["educationGender", "lowerThanMaturita", "male", "0", ""],
  ["educationGender", "lowerThanMaturita", "female", "1", ""],
  ["educationGender", "maturita", "male", "2", ""],
  ["educationGender", "maturita", "female", "1", ""],
  ["educationGender", "higherProfessional", "male", "3", ""],
  ["educationGender", "higherProfessional", "female", "4", ""],
  ["educationGender", "university", "male", "9", ""],
  ["educationGender", "university", "female", "11", ""],
  ["qualification", "primaryTeacher", "qualified", "21", ""],
  ["qualification", "primaryTeacher", "notQualified", "1", ""],
  ["qualification", "lowerSecondaryTeacher", "qualified", "0", ""],
  ["qualification", "lowerSecondaryTeacher", "notQualified", "0", ""],
  ["qualification", "educator", "qualified", "4", ""],
  ["qualification", "educator", "notQualified", "0", ""],
  ["qualification", "teachingAssistant", "qualified", "4", ""],
  ["qualification", "teachingAssistant", "notQualified", "0", ""],
  ["qualification", "specialPedagogue", "qualified", "1", ""],
  ["qualification", "specialPedagogue", "notQualified", "0", ""],
]);

replaceDataRows(workbook.getWorksheet("04 Zápis a žáci"), [
  ...admissionSummaryRows("firstGradeAdmissionCurrentYear", {
    firstTimeTotal: "46",
    firstTimeGirls: "22",
    afterDeferralTotal: "2",
    afterDeferralGirls: "1",
    enrolledTotal: "44",
    enrolledGirls: "21",
    deferralRequestsTotal: "3",
    deferralRequestsGirls: "1",
  }),
  ...admissionSummaryRows("firstGradeEnrollmentNextYear", {
    firstTimeTotal: "48",
    firstTimeGirls: "23",
    afterDeferralTotal: "4",
    afterDeferralGirls: "2",
    enrolledTotal: "44",
    enrolledGirls: "21",
    deferralRequestsTotal: "4",
    deferralRequestsGirls: "2",
  }),
  ["pupilsAdmittedDuringYear", "count", "1.–5. ročník", "4", ""],
  ["pupilsAdmittedDuringYear", "count", "6.–9. ročník", "3", ""],
  ["pupilsLeftDuringYear", "count", "1.–5. ročník", "2", ""],
  ["pupilsLeftDuringYear", "count", "6.–9. ročník", "3", ""],
  ["secondarySchoolAdmissions", "count", "víceleté gymnázium", "5", ""],
  ["secondarySchoolAdmissions", "count", "úplné střední odborné vzdělání s maturitou", "21", ""],
  ["secondarySchoolAdmissions", "count", "střední odborné vzdělání s výučním listem", "19", ""],
  ...pupilCountRows("pupilCountsSeptember", PUPIL_CLASSES),
  ...pupilCountRows("pupilCountsJune", PUPIL_CLASSES),
]);

const s05 = workbook.getWorksheet("05 ŠVP");
for (let row = s05.rowCount; row >= 2; row -= 1) {
  const block = String(s05.getRow(row).getCell(1).value ?? "").trim();
  if (block === "goalsEvaluation" || block === "educationProgram" || block === "schoolCurriculumPlan" || block === "weeklyHourPlan" || block === "summary") {
    s05.spliceRows(row, 1);
  }
}
addRows(s05, [
  ["educationProgram", "", "", "name", "Škola pro život", ""],
  ["educationProgram", "", "", "applicableClasses", "1.–9. ročník", ""],
  [
    "schoolCurriculumPlan",
    "",
    "",
    "description",
    "Výuka probíhala podle ŠVP „Škola pro život“ v souladu s RVP ZV. V průběhu roku proběhly úpravy zaměřené na digitální kompetence, čtenářskou gramotnost a formativní hodnocení.",
    "",
  ],
  ["goalsEvaluation", "1", "Rozvoj kompetence k učení", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "1", "Rozvoj kompetence k učení", "evidence", "Projektové dny, formativní hodnocení, badatelsky orientovaná výuka.", ""],
  ["goalsEvaluation", "2", "Rozvoj kompetence k řešení problémů", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "2", "Rozvoj kompetence k řešení problémů", "evidence", "Skupinová práce, otevřené úlohy, projekt Finanční gramotnost.", ""],
  ["goalsEvaluation", "3", "Rozvoj komunikativních kompetencí", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "3", "Rozvoj komunikativních kompetencí", "evidence", "Evropský den jazyků, prezentace žákovských prací.", ""],
  ["goalsEvaluation", "4", "Rozvoj sociálních a personálních kompetencí", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "4", "Rozvoj sociálních a personálních kompetencí", "evidence", "Adaptační kurz 6. ročníků, projektová výuka, třídnické hodiny.", ""],
  ["goalsEvaluation", "5", "Rozvoj občanských kompetencí", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "5", "Rozvoj občanských kompetencí", "evidence", "Den Země, spolupráce s městem a hasiči.", ""],
  ["goalsEvaluation", "6", "Rozvoj pracovních kompetencí", "level", "NEKTERE_HODINY", ""],
  ["goalsEvaluation", "6", "Rozvoj pracovních kompetencí", "evidence", "Práce v školní dílně a projektech zaměřených na praktické dovednosti.", ""],
  ["goalsEvaluation", "7", "Rozvoj digitálních kompetencí", "level", "VETSINA_HODIN", ""],
  ["goalsEvaluation", "7", "Rozvoj digitálních kompetencí", "evidence", "Google Workspace, Microsoft 365, robotické stavebnice, kyberbezpečnost.", ""],
  ["summary", "", "", "overallEvaluation", SUMMARY_05, ""],
  ["summary", "", "", "strengths", "Silnou stránkou je digitální vzdělávání, projektová výuka a spolupráce s rodiči a partnery města.", ""],
  ["summary", "", "", "areasForImprovement", "Škola bude dále rozvíjet formativní hodnocení a podporu wellbeing žáků a zaměstnanců.", ""],
  ["summary", "", "", "measuresForNextYear", "V dalším období škola usiluje o modernizaci vybavení, rozvoj AI ve vzdělávání a rozšíření spolupráce s partnery.", ""],
]);

replaceDataRows(workbook.getWorksheet("06 Výsledky vzdělávání"), [
  ["classResults", "first", "Celkem školy", "pupilsTotal", "303", ""],
  ["classResults", "first", "Celkem školy", "passedWithHonours", "125", ""],
  ["classResults", "first", "Celkem školy", "passed", "176", ""],
  ["classResults", "first", "Celkem školy", "failed", "2", ""],
  ["classResults", "first", "Celkem školy", "notAssessed", "0", ""],
  ["classResults", "first", "Celkem školy", "averageGrade", "1,52", ""],
  ["classResults", "second", "Celkem školy", "pupilsTotal", "304", ""],
  ["classResults", "second", "Celkem školy", "passedWithHonours", "132", ""],
  ["classResults", "second", "Celkem školy", "passed", "169", ""],
  ["classResults", "second", "Celkem školy", "failed", "3", ""],
  ["classResults", "second", "Celkem školy", "notAssessed", "0", ""],
  ["classResults", "second", "Celkem školy", "averageGrade", "1,48", ""],
  ["classResults", "second", "Celkem školy", "excusedAbsencePerPupil", "68", ""],
  ["classResults", "second", "Celkem školy", "unexcusedAbsencePerPupil", "0,2", ""],
  ["educationalMeasures", "first", "", "classTeacherPraise", "118", ""],
  ["educationalMeasures", "first", "", "principalPraise", "27", ""],
  ["educationalMeasures", "first", "", "classTeacherWarning", "15", ""],
  ["educationalMeasures", "first", "", "classTeacherReprimand", "8", ""],
  ["educationalMeasures", "first", "", "principalReprimand", "3", ""],
  ["educationalMeasures", "first", "", "secondConductGrade", "2", ""],
  ["summary", "", "", "summaryEvaluation", SUMMARY_06, ""],
]);

replaceDataRows(workbook.getWorksheet("07 Prevence a podpora"), [
  [
    "prevention",
    "",
    "",
    "preventionStrategyDescription",
    "Preventivní program byl zaměřen na prevenci šikany, kyberšikany, závislostí, podporu duševního zdraví a zdravý životní styl.",
    "",
  ],
  [
    "prevention",
    "",
    "",
    "preventionTeam",
    "Výchovný poradce Mgr. Martin Černý, metodik prevence Mgr. Lucie Benešová, speciální pedagog, vedení školy.",
    "",
  ],
  [
    "prevention",
    "",
    "",
    "cooperation",
    "Policie ČR, Městská policie, pedagogicko-psychologická poradna, neziskové organizace.",
    "",
  ],
  [
    "prevention",
    "",
    "",
    "evaluation",
    "Besedy a preventivní programy byly realizovány v průběhu celého školního roku ve spolupráci s externími partnery.",
    "",
  ],
  ["preventionProgrammes", "1", "", "title", "Beseda s Policií ČR", ""],
  ["preventionProgrammes", "1", "", "targetGroup", "6.–9. ročník", ""],
  ["preventionProgrammes", "1", "", "description", "Prevence rizikového chování a kybernetické bezpečnosti.", ""],
  ["preventionProgrammes", "1", "", "dateOrPeriod", "listopad 2024", ""],
  ["preventionProgrammes", "1", "", "provider", "Policie ČR", ""],
  ["preventionProgrammes", "2", "", "title", "Adaptační kurz 6. ročníků", ""],
  ["preventionProgrammes", "2", "", "targetGroup", "6. ročník", ""],
  ["preventionProgrammes", "2", "", "description", "Adaptační program pro spolupráci a komunikaci.", ""],
  ["preventionProgrammes", "2", "", "dateOrPeriod", "září 2024", ""],
  ["preventionProgrammes", "2", "", "provider", "školní poradenské pracoviště", ""],
  ["riskBehaviourIncidents", "1", "Kyberšikana", "count", "2", ""],
  ["riskBehaviourIncidents", "1", "Kyberšikana", "adoptedMeasures", "Individuální pohovory, spolupráce s rodiči, preventivní program.", ""],
  ["riskBehaviourIncidents", "2", "Šikana", "count", "1", ""],
  ["riskBehaviourIncidents", "2", "Šikana", "adoptedMeasures", "Práce s třídním kolektivem a metodikem prevence.", ""],
  ["riskBehaviourIncidents", "3", "Záškoláctví", "count", "3", ""],
  ["riskBehaviourIncidents", "3", "Záškoláctví", "adoptedMeasures", "Setkání se zákonnými zástupci, výchovná opatření.", ""],
  ["riskBehaviourIncidents", "4", "Vandalismus", "count", "1", ""],
  ["riskBehaviourIncidents", "4", "Vandalismus", "adoptedMeasures", "Náhrada škody, pohovory se žáky.", ""],
  ["riskBehaviourIncidents", "5", "Kouření", "count", "2", ""],
  ["riskBehaviourIncidents", "5", "Kouření", "adoptedMeasures", "Preventivní program, spolupráce s rodiči.", ""],
  ["riskBehaviourIncidents", "6", "Nevhodné chování na sociálních sítích", "count", "4", ""],
  ["riskBehaviourIncidents", "6", "Nevhodné chování na sociálních sítích", "adoptedMeasures", "Kybernetická prevence, individuální konzultace.", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsWithSvpTotal", "42", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsWithSupportMeasures", "42", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsWithIndividualEducationPlan", "8", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsWithPedagogicalIntervention", "18", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsWithTeachingAssistantSupport", "4", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsGifted", "12", ""],
  ["pupilsWithSupportNeeds", "", "", "pupilsExceptionallyGifted", "2", ""],
  [
    "supportConditions",
    "",
    "",
    "counsellingWorkplaceDescription",
    "Školní poradenské pracoviště tvořili výchovný poradce, metodik prevence, speciální pedagog a vedení školy.",
    "",
  ],
  ["supportConditions", "", "", "cooperationWithPppSpc", "Spolupráce s pedagogicko-psychologickou poradnou a speciálně pedagogickým centrem.", ""],
  [
    "supportConditions",
    "",
    "",
    "supportMeasuresDescription",
    "Podpora prostřednictvím asistentů pedagoga, pedagogické intervence, PdSP a úprav organizace výuky (1.–4. stupeň podpory).",
    "",
  ],
  ["supportConditions", "", "", "giftedSupportDescription", "Individuální vzdělávací plány, rozšiřující úkoly, soutěže a projektová výuka pro 12 nadaných žáků.", ""],
  ["supportConditions", "", "", "evaluation", "Podpora žáků se SVP a nadaných je průběžně vyhodnocována na poradách sboru.", ""],
  ["languagePreparation", "", "", "languagePreparationProvided", "NERELEVANTNI", ""],
  ["summary", "", "", "summaryEvaluation", SUMMARY_07, ""],
]);

replaceDataRows(workbook.getWorksheet("08 DVPP a rozvoj pracovníků"), [
  [
    "dvppOverview",
    "",
    "",
    "description",
    "Další vzdělávání pedagogických pracovníků probíhalo v souladu s ročním plánem DVPP a prioritami školy.",
    "",
  ],
  ["qualificationStudies", "1", "", "title", "Studium pedagogiky", ""],
  ["qualificationStudies", "1", "", "participantGroup", "Pedagogičtí pracovníci", ""],
  ["qualificationStudies", "1", "", "completed", "PROBIHA", ""],
  ["qualificationStudies", "2", "", "title", "Studium pro asistenta pedagoga", ""],
  ["qualificationStudies", "2", "", "participantGroup", "Asistenti pedagoga", ""],
  ["qualificationStudies", "2", "", "completed", "PROBIHA", ""],
  ["qualificationStudies", "3", "", "title", "Rozšíření odborné kvalifikace", ""],
  ["qualificationStudies", "3", "", "participantGroup", "Učitelé", ""],
  ["qualificationStudies", "3", "", "completed", "ANO", ""],
  ["additionalQualificationStudies", "1", "", "title", "Studium pro vedoucí pracovníky", ""],
  ["additionalQualificationStudies", "1", "", "completed", "PROBIHA", ""],
  ["additionalQualificationStudies", "2", "", "title", "Studium pro výchovné poradce", ""],
  ["additionalQualificationStudies", "2", "", "completed", "PROBIHA", ""],
  ["professionalDevelopmentTrainings", "1", "", "title", "Formativní hodnocení a digitální kompetence", ""],
  ["professionalDevelopmentTrainings", "1", "", "topic", "46 vzdělávacích akcí za rok", ""],
  ["professionalDevelopmentTrainings", "1", "", "participantGroup", "Pedagogičtí pracovníci", ""],
  ["professionalDevelopmentTrainings", "1", "", "hours", "186", ""],
  ["nonTeachingStaffDevelopment", "1", "", "title", "BOZP školení provozních zaměstnanců", ""],
  ["nonTeachingStaffDevelopment", "1", "", "participantGroup", "Nepedagogičtí pracovníci", ""],
  ["nonTeachingStaffDevelopment", "1", "", "topic", "Bezpečnost práce a požární ochrana", ""],
  ["nonTeachingStaffDevelopment", "1", "", "provider", "Externí školitel", ""],
  ["nonTeachingStaffDevelopment", "1", "", "period", "2024/2025", ""],
  ["nonTeachingStaffDevelopment", "1", "", "hours", "16", ""],
  [
    "selfStudy",
    "",
    "",
    "description",
    "Samostudium dle § 24 zákona o pedagogických pracovnících – inovace ve vzdělávání, digitální technologie, formativní hodnocení a kurikulární dokumenty.",
    "",
  ],
  ["summary", "", "", "summaryEvaluation", SUMMARY_08, ""],
]);

replaceDataRows(workbook.getWorksheet("09 Aktivity a prezentace"), [
  [
    "publicPresentation",
    "",
    "",
    "description",
    "Prezentace školy probíhala prostřednictvím webu, sociálních sítí, Bakaláři, městského zpravodaje a spolupráce s partnery města.",
    "",
  ],
  ["schoolEvents", "1", "", "title", "Adaptační kurz 6. ročníků", ""],
  ["schoolEvents", "1", "", "dateOrPeriod", "září 2024", ""],
  ["schoolEvents", "1", "", "publicEvent", "NE", ""],
  ["schoolEvents", "2", "", "title", "Evropský den jazyků", ""],
  ["schoolEvents", "2", "", "dateOrPeriod", "září 2024", ""],
  ["schoolEvents", "3", "", "title", "Den otevřených dveří", ""],
  ["schoolEvents", "3", "", "dateOrPeriod", "říjen 2024", ""],
  ["schoolEvents", "3", "", "publicEvent", "ANO", ""],
  ["schoolEvents", "3", "", "description", "Prezentace školy pro veřejnost a rodiče nových žáků.", ""],
  ["schoolEvents", "4", "", "title", "Dopravní soutěž mladých cyklistů", ""],
  ["schoolEvents", "4", "", "dateOrPeriod", "duben 2025", ""],
  ["schoolEvents", "5", "", "title", "Slavnostní vyřazení žáků 9. ročníku", ""],
  ["schoolEvents", "5", "", "dateOrPeriod", "červen 2025", ""],
  ["schoolEvents", "5", "", "publicEvent", "ANO", ""],
  [
    "schoolEvents",
    "5",
    "",
    "description",
    "Slavnostní vyřazení žáků 9. ročníku s účastí rodičů a zřizovatele.",
    "",
  ],
  ["competitions", "1", "", "title", "Matematická olympiáda", ""],
  ["competitions", "1", "", "level", "okresní, krajská", ""],
  ["competitions", "1", "", "result", "postup do krajského kola", ""],
  ["competitions", "2", "", "title", "Dopravní soutěž mladých cyklistů", ""],
  ["competitions", "2", "", "level", "krajská", ""],
  ["competitions", "2", "", "result", "vítězství družstva školy v okresním kole", ""],
  ["projectsAndCooperation", "1", "", "title", "Operační program Jan Amos Komenský", ""],
  ["projectsAndCooperation", "1", "", "type", "projekt", ""],
  ["projectsAndCooperation", "1", "", "description", "Personální podpora, inovativní a digitální vzdělávání, podpora žáků ohrožených neúspěchem.", ""],
  ["projectsAndCooperation", "1", "", "output", "Realizace projektu v celkové výši 1 050 000 Kč.", ""],
  ["summary", "", "", "summaryEvaluation", SUMMARY_09, ""],
]);

replaceDataRows(workbook.getWorksheet("10 ČŠI"), [
  ["status", "", "inspectionActivityStatus", "NEPROBEHLA", ""],
  ["noInspection", "", "noInspectionStatement", NO_INSPECTION, ""],
  ["summary", "", "summaryEvaluation", NO_INSPECTION, ""],
]);

replaceDataRows(workbook.getWorksheet("11 Hospodaření"), [
  ["reportingPeriod", "reportingPeriod", "", "kalendářní rok 2024", ""],
  ["revenue", "stateBudgetContribution", "", "34 850 000", ""],
  ["revenue", "founderContribution", "", "6 850 000", ""],
  ["revenue", "grantsAndProjects", "", "1 120 000", ""],
  ["revenue", "otherRevenue", "", "430 000", ""],
  ["revenue", "totalRevenue", "", "43 250 000", ""],
  ["expenses", "salaryCosts", "", "25 980 000", ""],
  ["expenses", "statutoryContributions", "", "8 785 000", ""],
  ["expenses", "energyCosts", "", "2 150 000", ""],
  ["expenses", "equipmentAndMaterials", "", "640 000", ""],
  ["expenses", "services", "", "520 000", ""],
  ["expenses", "repairsAndMaintenance", "", "680 000", ""],
  ["expenses", "otherExpenses", "", "4 165 000", ""],
  ["expenses", "totalExpenses", "", "42 920 000", ""],
  ["economicResult", "profitOrLoss", "", "330 000", ""],
  ["economicResult", "mainActivityResult", "", "330 000", ""],
  ["grantsAndSubsidies", "provider", "OP JAK – inovativní vzdělávání", "MŠMT / EU", ""],
  ["grantsAndSubsidies", "amount", "OP JAK – inovativní vzdělávání", "1 050 000", ""],
  ["grantsAndSubsidies", "usedAmount", "OP JAK – inovativní vzdělávání", "780 000", ""],
  ["supplementaryActivity", "carriedOut", "", "NEUVEDENO", ""],
  ["investmentsAndRepairs", "title", "Modernizace IT a vybavení", "Modernizace IT a vybavení", ""],
  ["investmentsAndRepairs", "amount", "Modernizace IT a vybavení", "1 480 000", ""],
  [
    "investmentsAndRepairs",
    "description",
    "Modernizace IT a vybavení",
    "Modernizace počítačové sítě, interaktivní technika, notebooky pro pedagogy, vybavení učebny informatiky.",
    "",
  ],
  ["summary", "summaryCommentary", "", SUMMARY_11, ""],
]);

replaceDataRows(workbook.getWorksheet("12 Projekty a granty"), [
  ["projects", "1", "title", "Operační program Jan Amos Komenský – inovativní vzdělávání", ""],
  [
    "projects",
    "1",
    "description",
    "Personální podpora, inovativní a digitální vzdělávání, podpora žáků ohrožených neúspěchem ve vzdělávání.",
    "",
  ],
  ["projects", "1", "provider", "MŠMT / EU", ""],
  ["projects", "1", "amount", "1 050 000 Kč", ""],
  ["projects", "1", "focusAreas", "digitální vzdělávání, podpora žáků se SVP", ""],
  [
    "otherPrograms",
    "",
    "",
    "Škola se dlouhodobě zapojuje do programů podpory čtenářské gramotnosti a environmentální výchovy.",
    "",
  ],
  [
    "summary",
    "",
    "summaryEvaluation",
    "Realizované projekty přispěly k rozvoji digitálních kompetencí, podpoře pedagogického sboru a zkvalitnění vzdělávání.",
    "",
  ],
]);

replaceDataRows(workbook.getWorksheet("13 Spolupráce s rodiči"), [
  [
    "parentCooperation",
    "Spolupráce se zákonnými zástupci probíhala pravidelně formou třídních schůzek, individuálních konzultací, informačních kanálů školy (web, Bakaláři) a akcí pro rodiče (Den otevřených dveří, projektové dny).",
    "",
  ],
  [
    "founderCooperation",
    "Zřizovatel projednal výsledky vzdělávání, hospodaření a plán investic. Školská rada průběžně informovala zřizovatele o činnosti školy.",
    "",
  ],
  [
    "partners",
    "Škola spolupracovala s městskou knihovnou, sportovními kluby, obcí, PPP a dalšími organizacemi při realizaci vzdělávacích a mimoškolních aktivit.",
    "",
  ],
  [
    "summaryEvaluation",
    "Spolupráce s rodiči, zřizovatelem a partnery byla v průběhu školního roku aktivní a přispěla k plnění cílů školy.",
    "",
  ],
]);

replaceDataRows(workbook.getWorksheet("14 Závěr"), [
  [
    "overallEvaluation",
    "Ve školním roce 2024/2025 ZŠ Komenského plnila cíle ŠVP, udržovala kvalitu vzdělávání, podporovala rozvoj žáků včetně žáků se speciálními vzdělávacími potřebami a realizovala projekty rozvoje školy. Personální zabezpečení bylo stabilní, spolupráce s rodiči a partnery probíhala systematicky.",
    "",
  ],
  [
    "futurePlans",
    "V následujícím období bude škola nadále rozvíjet digitální kompetence, prevenci rizikového chování, podporu čtenářské gramotnosti a materiálně-technické vybavení v souladu s plánem rozvoje školy.",
    "",
  ],
]);

const outputPaths = [
  path.resolve("demo-vyrocni-zprava-import-komenskeho-filled.xlsx"),
  path.resolve("demo-vyrocni-zprava-import-v2-filled.xlsx"),
  path.resolve("C:/Users/info/Downloads/sablona-vyrocni-zprava-import_new_vyplnena_2.xlsx"),
  path.resolve("C:/Users/info/Downloads_C/sablona-vyrocni-zprava-import_new_vyplnena_2 (1).xlsx"),
];

for (const outputPath of outputPaths) {
  const dir = path.dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  try {
    await workbook.xlsx.writeFile(outputPath);
    console.log("written", outputPath);
  } catch (error) {
    console.warn("skip write (locked?):", outputPath, error instanceof Error ? error.message : error);
  }
}

const buffer = await workbook.xlsx.writeBuffer();
const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const result = await parseVyrocniZpravaImportArrayBuffer(ab, {
  currentProfile: createDefaultSchoolProfile(),
  sourceFileName: "zskomenskeho-filled.xlsx",
});
console.log("import valid:", result.valid, "errors:", result.errors.length, "warnings:", result.warnings.length, "ignored:", result.ignored.length);
console.log("readiness:", JSON.stringify(result.sectionReadiness));
if (result.ignored.length > 0) {
  console.log("ignored:", result.ignored.map((item) => item.message).slice(0, 10));
}
if (result.warnings.length > 0) {
  console.log("warnings:", result.warnings.map((item) => item.message).slice(0, 10));
}
if (result.errors.length > 0) {
  console.log("errors:", result.errors.slice(0, 5).map((item) => item.message));
  process.exitCode = 1;
}
