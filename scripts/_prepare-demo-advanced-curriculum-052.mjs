import ExcelJS from "exceljs";
import path from "node:path";

const sourcePath = path.resolve("demo-vyrocni-zprava-import-v2.xlsx");
const outputPath = path.resolve("demo-vyrocni-zprava-import-v2-advanced-052.xlsx");

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(sourcePath);

const sheet = workbook.getWorksheet("05 ŠVP");
if (!sheet) {
  throw new Error("Missing worksheet '05 ŠVP' in demo file.");
}

const headerValues = (sheet.getRow(1).values ?? []).slice(1).map((value) => String(value ?? "").trim());
const colByHeader = new Map(headerValues.map((header, index) => [header, index + 1]));

const requiredHeaders = [
  "blok",
  "poradi",
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
];

for (const header of requiredHeaders) {
  if (colByHeader.has(header)) continue;
  const nextCol = sheet.columnCount + 1;
  sheet.getRow(1).getCell(nextCol).value = header;
  colByHeader.set(header, nextCol);
  sheet.getColumn(nextCol).width = 18;
}

for (let rowNumber = sheet.rowCount; rowNumber >= 2; rowNumber -= 1) {
  const row = sheet.getRow(rowNumber);
  const block = String(row.getCell(colByHeader.get("blok")).value ?? "").trim();
  if (block === "advancedCurriculumPlan") {
    sheet.spliceRows(rowNumber, 1);
  }
}

const advancedRows = [
  {
    poradi: "1",
    vzdelavaci_oblast: "Jazyk a jazyková komunikace",
    predmet: "Český jazyk a literatura",
    detail_predmetu: "",
    rocnik_1: "7+2",
    rocnik_2: "6+1",
    rocnik_3: "6+1",
    rocnik_4: "5+2",
    rocnik_5: "5+2",
    dotace_1_stupen: "29+8",
    rocnik_6: "4+1",
    rocnik_7: "4+1",
    rocnik_8: "4+1",
    rocnik_9: "4+1",
    dotace_2_stupen: "16+4",
    je_souctovy_radek: "NE",
  },
  {
    poradi: "2",
    vzdelavaci_oblast: "",
    predmet: "Cizí jazyk",
    detail_predmetu: "Německý jazyk; Ruský jazyk; Cvičení v anglickém jazyce",
    rocnik_1: "",
    rocnik_2: "",
    rocnik_3: "",
    rocnik_4: "",
    rocnik_5: "",
    dotace_1_stupen: "",
    rocnik_6: "3",
    rocnik_7: "3",
    rocnik_8: "3",
    rocnik_9: "3",
    dotace_2_stupen: "12",
    je_souctovy_radek: "NE",
  },
  {
    poradi: "3",
    vzdelavaci_oblast: "Celkem hodin",
    predmet: "",
    detail_predmetu: "",
    rocnik_1: "",
    rocnik_2: "",
    rocnik_3: "",
    rocnik_4: "",
    rocnik_5: "",
    dotace_1_stupen: "102+16",
    rocnik_6: "",
    rocnik_7: "",
    rocnik_8: "",
    rocnik_9: "",
    dotace_2_stupen: "104+18",
    je_souctovy_radek: "ANO",
  },
];

for (const rowData of advancedRows) {
  const row = sheet.addRow([]);
  row.getCell(colByHeader.get("blok")).value = "advancedCurriculumPlan";
  for (const [key, value] of Object.entries(rowData)) {
    row.getCell(colByHeader.get(key)).value = value;
  }
}

await workbook.xlsx.writeFile(outputPath);
console.log(`Prepared: ${outputPath}`);
