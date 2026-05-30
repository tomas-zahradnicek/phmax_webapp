import type { BasicType } from "../phmax-zs-logic";
import {
  B9_B10,
  B26_B28,
  pickBand,
  round2,
  type GymRow,
  type HealthRow,
  type MixedRow,
  type PhaRow,
  type PsychRow,
} from "../phmax-zs-logic";
import { APP_AUTHOR_DISPLAY_NAME, APP_AUTHOR_EMAIL, APP_AUTHOR_EXPORT_ROWS } from "../calculator-ui-constants";
import { APP_VERSION } from "../app-version";
import { buildZsExtendedExportMetaRows } from "./zs-export-rows";

export type ZsExportSummaryRow = readonly [string, string | number];

export type ZsComputedGroupRow = {
  kind: string;
  mode?: "current_only" | "higher_of_two";
  currentPupils: number;
  currentClasses: number;
  prevPupils: number;
  prevClasses: number;
  usedAvg: number;
  bandLabel: string;
  perClass: number;
  subtotal: number;
};

export type ZsGymComputedRow = GymRow & {
  avg: number;
  bandLabel: string;
  perClass: number;
  subtotal: number;
};

export type ZsExportBuildInput = {
  tab: "phmax" | "pha" | "php";
  modeLabel: string;
  exportLabel: string;
  wizardChoice: string;
  dataMode: "own" | "example";
  selectedExample: string;
  warnings: readonly string[];
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
  psychRows: PsychRow[];
  healthRows: HealthRow[];
  minorityType: string;
  minority1Classes: number;
  minority1Pupils: number;
  minority2Classes: number;
  minority2Pupils: number;
  gymRows: GymRow[];
  mixedRows: MixedRow[];
  mixedMethodFirstZsPupils: number;
  mixedMethodFirstZsClasses: number;
  mixedMethodFirstSpecialPupils: number;
  mixedMethodFirstSpecialClasses: number;
  mixedMethodSecondZsPupils: number;
  mixedMethodSecondZsClasses: number;
  mixedMethodSecondSpecialPupils: number;
  mixedMethodSecondSpecialClasses: number;
  special1Classes: number;
  special1Pupils: number;
  special2Classes: number;
  special2Pupils: number;
  specialIIClasses: number;
  specialIIPupils: number;
  prepClasses: number;
  prepChildren: number;
  prepSpecialClasses: number;
  prepSpecialChildren: number;
  p38First: number;
  p38Second: number;
  p41First: number;
  p41Second: number;
  phpMethodMode: "three_year_avg" | "short_period";
  phpYear1: number;
  phpYear2: number;
  phpYear3: number;
  phpExcludedAbroad: number;
  phpExcludedForeignSchoolCz: number;
  phpExcludedIndividual: number;
  phpExcludedSchool: boolean;
  phaRows: PhaRow[];
  psychComputedRows: ZsComputedGroupRow[];
  healthComputedRows: ZsComputedGroupRow[];
  gymComputedRows: ZsGymComputedRow[];
  summaryRows: readonly ZsExportSummaryRow[];
  methodikaLabel: string;
};

export function buildZsXlsxContextRows(input: ZsExportBuildInput): [string, string | number][] {
  const tabLabel = input.tab === "phmax" ? "PHmax" : input.tab === "pha" ? "PHAmax" : "PHPmax";
  return [
    ["Verze aplikace", APP_VERSION],
    ["Název exportu", "Kalkulačka ZŠ – souhrn (XLSX)"],
    ["Datum a čas exportu (ISO)", new Date().toISOString()],
    ["Datum a čas exportu (místní)", new Date().toLocaleString("cs-CZ")],
    ["Metodický podklad (orientačně)", input.methodikaLabel],
    ["Režim výpočtu (typ školy)", input.modeLabel],
    ["Aktivní záložka při exportu", tabLabel],
    ["Označení exportu / škola", input.exportLabel.trim() || "–"],
    ["Průvodce (volba scénáře)", input.wizardChoice || "–"],
    ["Práce s údaji", input.dataMode === "example" ? "ukázkový příklad" : "vlastní škola"],
    ["Identifikátor ukázkového příkladu", input.selectedExample || "–"],
    ["", ""],
    ["Varování", input.warnings.length ? input.warnings.join(" | ") : "–"],
    ["", ""],
    [
      "Poznámka",
      "Úplný dvousloupcový výpis (vstupy, výstupy, detaily PHAmax / psych / gym / smíšené) je na listu „Hodnoty“.",
    ],
    ["Vytvořil:", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
  ];
}

export function buildZsExtendedCsvRows(input: ZsExportBuildInput): readonly ZsExportSummaryRow[] {
  const tabLabel = input.tab === "phmax" ? "PHmax" : input.tab === "pha" ? "PHAmax" : "PHPmax";
  const exportNow = new Date();
  const head: ZsExportSummaryRow[] = [
    ...buildZsExtendedExportMetaRows({
      appVersion: APP_VERSION,
      methodikaLabel: input.methodikaLabel,
      modeLabel: input.modeLabel,
      tabLabel,
      exportLabel: input.exportLabel,
      wizardChoice: input.wizardChoice,
      dataMode: input.dataMode,
      selectedExample: input.selectedExample,
      exportIso: exportNow.toISOString(),
      exportLocal: exportNow.toLocaleString("cs-CZ"),
    }),
    ["=== PHmax – vstupy (agregované) ===", ""],
    ["basicType (kód)", input.basicType],
    ["Běžné třídy – 1. st. počet tříd", input.basic1Classes],
    ["Běžné třídy – 1. st. počet žáků", input.basic1Pupils],
    ["Běžné třídy – 2. st. počet tříd", input.basic2Classes],
    ["Běžné třídy – 2. st. počet žáků", input.basic2Pupils],
    ["§ 16/9 – 1. st. třídy", input.incl1Classes],
    ["§ 16/9 – 1. st. žáci", input.incl1Pupils],
    ["§ 16/9 – 2. st. třídy", input.incl2Classes],
    ["§ 16/9 – 2. st. žáci", input.incl2Pupils],
    ["Psychiatrická škola – počet řádků", input.psychRows.length],
    ["ZŠ při zdrav. zař. (B11–B13) – počet řádků", input.healthRows.length],
    ["Menšina – variant (kód)", input.minorityType],
    ["Menšina – 1. st. třídy / žáci", `${input.minority1Classes} / ${input.minority1Pupils}`],
    ["Menšina – 2. st. třídy / žáci", `${input.minority2Classes} / ${input.minority2Pupils}`],
    ["Gymnázia – počet řádků", input.gymRows.length],
    ["Smíšené (zjednodušený seznam řádků) – počet", input.mixedRows.length],
    ["Smíšené tab. – 1. st. C/01 žáci / třídy", `${input.mixedMethodFirstZsPupils} / ${input.mixedMethodFirstZsClasses}`],
    ["Smíšené tab. – 1. st. B/01 žáci / třídy", `${input.mixedMethodFirstSpecialPupils} / ${input.mixedMethodFirstSpecialClasses}`],
    ["Smíšené tab. – 2. st. C/01 žáci / třídy", `${input.mixedMethodSecondZsPupils} / ${input.mixedMethodSecondZsClasses}`],
    ["Smíšené tab. – 2. st. B/01 žáci / třídy", `${input.mixedMethodSecondSpecialPupils} / ${input.mixedMethodSecondSpecialClasses}`],
    ["ZŠ speciální I. díl – 1. st. třídy / žáci", `${input.special1Classes} / ${input.special1Pupils}`],
    ["ZŠ speciální I. díl – 2. st. třídy / žáci", `${input.special2Classes} / ${input.special2Pupils}`],
    ["ZŠ speciální II. díl třídy / žáci", `${input.specialIIClasses} / ${input.specialIIPupils}`],
    ["Přípravná třída třídy / děti", `${input.prepClasses} / ${input.prepChildren}`],
    ["Přípravný stupeň ZŠS třídy / děti", `${input.prepSpecialClasses} / ${input.prepSpecialChildren}`],
    ["§ 38 žáci 1. st. / 2. st.", `${input.p38First} / ${input.p38Second}`],
    ["§ 41 žáci 1. st. / 2. st.", `${input.p41First} / ${input.p41Second}`],
    ["", ""],
    ["=== PHPmax – vstupy ===", ""],
    ["PHP metoda", input.phpMethodMode === "three_year_avg" ? "tříletý průměr" : "kratší období"],
    ["PHP rok 1 / 2 / 3 žáci", `${input.phpYear1} / ${input.phpYear2} / ${input.phpYear3}`],
    [
      "PHP nezapoč. zahraničí / ZŠ v ČR / individuální",
      `${input.phpExcludedAbroad} / ${input.phpExcludedForeignSchoolCz} / ${input.phpExcludedIndividual}`,
    ],
    ["PHP škola vyloučena z výpočtu", input.phpExcludedSchool ? "ano" : "ne"],
    ["", ""],
    ["=== Varování ===", input.warnings.length ? input.warnings.join(" | ") : "–"],
    ["", ""],
    ["=== Souhrnné výstupy ===", ""],
  ];
  const out: ZsExportSummaryRow[] = [...head, ...input.summaryRows.map((r) => [r[0], r[1]] as ZsExportSummaryRow)];
  if (input.phaRows.length > 0) {
    out.push(["", ""]);
    out.push(["=== PHAmax – jednotlivé řádky ===", ""]);
    input.phaRows.forEach((r, i) => {
      out.push([`PHA ${i + 1} – typ (kód)`, r.kind]);
      out.push([`PHA ${i + 1} – třídy`, r.classes]);
      out.push([`PHA ${i + 1} – žáci`, r.pupils]);
    });
  }
  if (input.psychRows.length > 0) {
    out.push(["", ""]);
    out.push(["=== Psychiatrická škola – jednotlivé řádky ===", ""]);
    input.psychComputedRows.forEach((r, i) => {
      out.push([`Psych ${i + 1} – typ (kód)`, r.kind]);
      out.push([`Psych ${i + 1} – režim průměru`, r.mode === "current_only" ? "jen aktuální" : "vyšší ze dvou"]);
      out.push([`Psych ${i + 1} – aktuální žáci / třídy`, `${r.currentPupils} / ${r.currentClasses}`]);
      out.push([`Psych ${i + 1} – předchozí žáci / třídy`, `${r.prevPupils} / ${r.prevClasses}`]);
      out.push([`Psych ${i + 1} – použitý průměr žáků/třídu`, r.usedAvg]);
      out.push([`Psych ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
      out.push([`Psych ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
    });
  }
  if (input.healthRows.length > 0) {
    out.push(["", ""]);
    out.push(["=== ZŠ při zdravotnickém zařízení (B11–B13) – řádky ===", ""]);
    input.healthComputedRows.forEach((r, i) => {
      out.push([`ZdrZař ${i + 1} – typ (kód)`, r.kind]);
      out.push([`ZdrZař ${i + 1} – režim průměru`, r.mode === "current_only" ? "jen aktuální" : "vyšší ze dvou"]);
      out.push([`ZdrZař ${i + 1} – aktuální žáci / třídy`, `${r.currentPupils} / ${r.currentClasses}`]);
      out.push([`ZdrZař ${i + 1} – předchozí žáci / třídy`, `${r.prevPupils} / ${r.prevClasses}`]);
      out.push([`ZdrZař ${i + 1} – použitý průměr žáků/třídu`, r.usedAvg]);
      out.push([`ZdrZař ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
      out.push([`ZdrZař ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
    });
  }
  if (input.gymRows.length > 0) {
    out.push(["", ""]);
    out.push(["=== Nižší ročníky gymnázií – jednotlivé řádky ===", ""]);
    input.gymComputedRows.forEach((r, i) => {
      out.push([`Gym ${i + 1} – typ (kód)`, r.kind]);
      out.push([`Gym ${i + 1} – třídy / žáci`, `${r.classes} / ${r.pupils}`]);
      out.push([`Gym ${i + 1} – průměr žáků/třídu`, r.avg]);
      out.push([`Gym ${i + 1} – pásmo / PHmax na 1 třídu`, `${r.bandLabel} / ${r.perClass}`]);
      out.push([`Gym ${i + 1} – řádkový výsledek PHmax`, r.subtotal]);
    });
  }
  if (input.mixedRows.length > 0) {
    out.push(["", ""]);
    out.push(["=== Smíšené třídy (zjednodušený seznam řádků) ===", ""]);
    input.mixedRows.forEach((row, i) => {
      const avg = row.classes > 0 ? row.pupils / row.classes : 0;
      const band =
        row.majority === "zs"
          ? pickBand(avg, row.stage === "first" ? B9_B10.first : B9_B10.second)
          : pickBand(avg, row.stage === "first" ? B26_B28.special1 : B26_B28.special2);
      const linePhmax = round2(row.classes * band.value);
      out.push([`Smíšené ${i + 1} – stupeň (kód)`, row.stage]);
      out.push([`Smíšené ${i + 1} – převažující obor (kód)`, row.majority]);
      out.push([`Smíšené ${i + 1} – třídy / žáci`, `${row.classes} / ${row.pupils}`]);
      out.push([`Smíšené ${i + 1} – průměr žáků/třídu`, round2(avg)]);
      out.push([`Smíšené ${i + 1} – pásmo / PHmax na 1 třídu`, `${band.label} / ${band.value}`]);
      out.push([`Smíšené ${i + 1} – řádkový výsledek PHmax`, linePhmax]);
    });
  }
  for (const row of APP_AUTHOR_EXPORT_ROWS) {
    out.push([row[0], row[1]]);
  }
  return out;
}
